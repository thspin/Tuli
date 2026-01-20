# Sistema de Cache en Tuli v1

**Fecha:** 2026-01-15  
**Versión:** 1.0

---

## 📋 Resumen Ejecutivo

Tuli v1 utiliza el **sistema de cache integrado de Next.js 16 (App Router)** basado en `revalidatePath()` para invalidar cache después de mutaciones. Actualmente NO usa cache avanzado como `unstable_cache`, pero está preparado para implementarlo.

---

## 🔍 Cómo Funciona el Cache Actualmente

### 1. Cache Automático de Next.js

Next.js cachea automáticamente los resultados de:
- ✅ **Server Components** (RSC)
- ✅ **Fetch requests** en server components
- ✅ **Route Handlers** con `GET`

**Ejemplo:**
```typescript
// app/accounts/page.tsx (Server Component)
async function AccountsPage() {
  // Este query se cachea automáticamente
  const data = await getAccountsPageData();
  
  return <AccountsClient data={data} />;
}
```

El cache persiste entre requests hasta que:
1. Se hace un **hard refresh** (Ctrl+F5)
2. Se llama a **`revalidatePath()`**
3. Pasa el tiempo de **revalidación** (si está configurado)

---

### 2. Invalidación de Cache con `revalidatePath()`

Después de **cada mutación** (crear, editar, eliminar), llamamos a `revalidatePath()` para invalidar el cache.

**Patrón utilizado en todas las Server Actions:**

```typescript
'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';

export async function createTransaction(formData: FormData) {
  try {
    // 1. Validar datos (con Zod)
    // 2. Crear transacción en BD
    const transaction = await prisma.transaction.create({ ... });
    
    // 3. Actualizar balance del producto
    await prisma.product.update({ ... });
    
    // 4. ✅ INVALIDAR CACHE de las páginas afectadas
    revalidatePath('/accounts');      // Página de cuentas
    revalidatePath('/transactions');  // Página de transacciones
    
    return { success: true, data: transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

### 3. Rutas que Revalidan Cache

Aquí está el mapeo de qué Server Actions invalidan qué rutas:

| Acción | Rutas Revalidadas |
|--------|-------------------|
| **Crear/Editar/Eliminar Cuenta o Producto** | `/accounts` |
| **Crear/Editar/Eliminar Transacción** | `/accounts`, `/transactions` |
| **Crear/Editar/Eliminar Resumen** | `/accounts`, `/calendar` |
| **Pagar Resumen** | `/accounts`, `/calendar`, `/` (dashboard) |
| **Crear/Editar/Eliminar Servicio** | `/services` |
| **Crear/Editar/Eliminar Nota** | `/notes`, `/calendar` |
| **Importar PDF** | `/accounts`, `/transactions`, `/calendar` |
| **Transferencia** | `/accounts`, `/transactions` |

**Ubicación de los `revalidatePath()`:**
- `src/actions/transactions/transaction-actions.ts`
- `src/actions/summaries/summary-actions.ts`
- `src/actions/services/service-actions.ts`
- `src/actions/notes.ts`
- etc.

---

## 🚀 Cache Avanzado (NO Implementado Aún)

### ¿Por qué no está implementado?

En la **Fase 2 (MVP)**, el cache automático de Next.js es suficiente porque:
- Solo hay 1 usuario demo
- Los queries son rápidos (< 100ms)
- No hay carga concurrente

### ¿Cuándo implementarlo?

Cuando tengas:
- ✅ Múltiples usuarios (> 100)
- ✅ Queries lentos (> 500ms)
- ✅ Alta concurrencia (muchos requests simultáneos)

---

## 📖 Guía de Implementación de Cache Avanzado

### Opción 1: `unstable_cache` de Next.js

**Ventajas:**
- ✅ Integrado en Next.js
- ✅ Funciona con Vercel
- ✅ No requiere Redis

**Ejemplo:**
```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

export const getCachedProducts = unstable_cache(
  async (userId: string) => {
    console.log('[CACHE MISS] Fetching products for user:', userId);
    
    return prisma.financialProduct.findMany({
      where: { userId },
      include: {
        institution: true,
        summaries: {
          where: { isClosed: false },
          orderBy: { closingDate: 'desc' },
          take: 1
        }
      }
    });
  },
  ['products'], // Cache key base
  {
    revalidate: 60, // Cache por 60 segundos
    tags: ['products'] // Tags para invalidación selectiva
  }
);

// Usar en Server Component
async function AccountsPage() {
  const user = await getDemoUser();
  const products = await getCachedProducts(user.id);
  
  return <AccountsClient products={products} />;
}
```

**Invalidar cuando se modifica:**
```typescript
import { revalidateTag } from 'next/cache';

export async function createProduct(formData: FormData) {
  const product = await prisma.product.create({ ... });
  
  // ✅ Invalida el cache por tag
  revalidateTag('products');
  
  return { success: true, data: product };
}
```

---

### Opción 2: Redis Cache (Upstash)

**Ventajas:**
- ✅ Más control sobre TTL
- ✅ Compartido entre instancias
- ✅ Ideal para serverless

**Setup:**
```bash
npm install @upstash/redis
```

```typescript
// src/lib/redis-cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedProducts(userId: string) {
  const cacheKey = `products:${userId}`;
  
  // Intentar leer del cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('[CACHE HIT]', cacheKey);
    return cached;
  }
  
  // Cache miss: Consultar BD
  console.log('[CACHE MISS]', cacheKey);
  const products = await prisma.financialProduct.findMany({
    where: { userId },
    include: { institution: true }
  });
  
  // Guardar en cache por 5 minutos
  await redis.set(cacheKey, products, { ex: 300 });
  
  return products;
}

// Invalidar
export async function invalidateProductsCache(userId: string) {
  await redis.del(`products:${userId}`);
}
```

---

## 🧪 Testing de Cache

### Cómo verificar que el cache funciona:

1. **Agregar logs en Server Actions:**
```typescript
export async function getAccountsPageData() {
  console.log('[DEBUG] Fetching accounts data from database');
  
  const institutions = await prisma.financialInstitution.findMany({ ... });
  
  console.log(`[DEBUG] Found ${institutions.length} institutions`);
  return institutions;
}
```

2. **Observar en terminal de Next.js:**
- Primera carga: `[DEBUG] Fetching accounts data from database`
- Segunda carga (sin mutación): Sin log → cache hit ✅
- Después de mutación + `revalidatePath()`: Log aparece → cache invalidado ✅

3. **Usar Network Tab:**
- Cache hit en Next.js: `(cache: HIT)`
- Cache miss: `(cache: MISS)`

---

## 📊 Estrategia de Cache por Feature

| Feature | Estrategia | TTL Recomendado | Prioridad |
|---------|-----------|-----------------|-----------|
| **Productos Financieros** | `unstable_cache` | 60s | 🟡 Media |
| **Transacciones (lista)** | Paginación + `unstable_cache` | 30s | 🔴 Alta |
| **Resúmenes Cerrados** | `unstable_cache` | 300s (5min) | 🟢 Baja |
| **Categorías** | `unstable_cache` | 3600s (1h) | 🟢 Baja |
| **Analytics** | `unstable_cache` | 300s | 🟡 Media |
| **Tipos de Cambio** | Redis | 3600s (1h) | 🟡 Media |

---

## 🔥 Problemas Comunes y Soluciones

### Problema 1: "Los datos no se actualizan después de crear algo"

**Causa:** Falta `revalidatePath()` en la Server Action.

**Solución:**
```typescript
export async function createProduct(formData: FormData) {
  const product = await prisma.product.create({ ... });
  
  // ✅ AGREGAR ESTO
  revalidatePath('/accounts');
  
  return { success: true, data: product };
}
```

---

### Problema 2: "El cache se invalida demasiado seguido"

**Causa:** Llamar a `revalidatePath('/')` invalida TODO el cache.

**Solución:** Ser específico con las rutas:
```typescript
// ❌ MAL: Invalida todo
revalidatePath('/');

// ✅ BIEN: Solo invalida lo necesario
revalidatePath('/accounts');
revalidatePath('/transactions');
```

---

### Problema 3: "Cache stale en producción"

**Causa:** Vercel cachea builds estáticos agresivamente.

**Solución:** Usar `revalidate` en page.tsx:
```typescript
// app/accounts/page.tsx
export const revalidate = 60; // Revalidar cada 60 segundos

export default async function AccountsPage() {
  const data = await getAccountsPageData();
  return <AccountsClient data={data} />;
}
```

---

## 🎯 Recomendaciones

### Para MVP (Actual):
✅ Usar solo `revalidatePath()` (ya implementado)  
✅ No agregar cache avanzado todavía  
✅ Monitorear performance con Vercel Analytics  

### Para Producción (> 100 usuarios):
🔜 Implementar `unstable_cache` en queries pesados  
🔜 Agregar paginación antes de cachear listas largas  
🔜 Usar Redis para tipos de cambio (actualización cada hora)  

### Para Escala (> 1000 usuarios):
🚀 Implementar CDN para assets estáticos  
🚀 Database read replicas  
🚀 Cache distribuido con Redis Cluster  

---

## 📚 Referencias

- [Next.js Caching Guide](https://nextjs.org/docs/app/building-your-application/caching)
- [revalidatePath Documentation](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [unstable_cache API](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)

---

**Última actualización:** 2026-01-15  
**Versión:** 1.0
