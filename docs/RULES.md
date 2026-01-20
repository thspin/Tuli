# RULES.md - Reglas Absolutas de Tuli v1

**Última actualización:** 2026-01-14  
**Propósito:** Reglas NO negociables para desarrollo con IA

---

## 🚫 NUNCA HACER

### Base de Datos

- ❌ **NUNCA** cambiar el schema de Prisma sin crear migración
- ❌ **NUNCA** usar `prisma db push` en producción (solo `migrate deploy`)
- ❌ **NUNCA** hacer queries raw SQL (usar Prisma Client)
- ❌ **NUNCA** exponer el `userId` en URLs o formularios cliente
- ❌ **NUNCA** olvidar el filtro `where: { userId }` en queries

### Server Actions

- ❌ **NUNCA** aceptar `userId` desde el cliente (obtener con `getDemoUser()`)
- ❌ **NUNCA** olvidar `'use server'` al inicio del archivo
- ❌ **NUNCA** retornar objetos con `Date` sin serializar (usar `.toISOString()`)
- ❌ **NUNCA** olvidar `revalidatePath()` después de mutaciones
- ❌ **NUNCA** hacer múltiples queries cuando puedes usar `include`

### Componentes

- ❌ **NUNCA** usar `'use client'` si no es necesario (mantener Server Components)
- ❌ **NUNCA** hacer fetch directo en cliente (usar Server Actions)
- ❌ **NUNCA** usar `rounded-lg` (usar `rounded-tuli-lg`)
- ❌ **NUNCA** hardcodear colores (usar variables CSS de `globals.css`)
- ❌ **NUNCA** crear componentes UI nuevos sin consultar `/src/components/ui/`

### TypeScript

- ❌ **NUNCA** usar `any` (usar `unknown` o tipo específico)
- ❌ **NUNCA** usar `@ts-ignore` sin comentario explicativo
- ❌ **NUNCA** crear tipos inline complejos (exportar desde `/src/types/`)
- ❌ **NUNCA** importar tipos de Prisma directamente en cliente (usar tipos serializados)

### Transacciones

- ❌ **NUNCA** crear transacción sin actualizar balance del producto
- ❌ **NUNCA** olvidar crear `SummaryItem` si el producto es tarjeta de crédito
- ❌ **NUNCA** permitir balance negativo en cuentas (validar antes)
- ❌ **NUNCA** generar cuotas sin `installmentId` común

---

## ✅ SIEMPRE HACER

### Validación

- ✅ **SIEMPRE** validar con Zod en Server Actions
- ✅ **SIEMPRE** verificar permisos (`userId` coincide)
- ✅ **SIEMPRE** usar `try-catch` en operaciones de BD
- ✅ **SIEMPRE** retornar `{ success: boolean, error?: string, data?: T }`

### Naming Conventions

- ✅ **SIEMPRE** usar PascalCase para componentes (`ProductCard.tsx`)
- ✅ **SIEMPRE** usar kebab-case para actions (`account-actions.ts`)
- ✅ **SIEMPRE** usar camelCase para funciones (`createProduct`)
- ✅ **SIEMPRE** usar descriptive names (`getProductWithTransactions`, no `getData`)

### Sistema de Diseño

- ✅ **SIEMPRE** usar tokens Tuli: `rounded-tuli-*`, `shadow-tuli-*`, `spacing-*`
- ✅ **SIEMPRE** usar componentes de `/src/components/ui/` antes de crear nuevos
- ✅ **SIEMPRE** mantener accesibilidad (aria-labels, focus states)
- ✅ **SIEMPRE** usar transiciones (`transition-base` o `transition-fast`)

### Performance

- ✅ **SIEMPRE** usar `select` en Prisma para limitar campos
- ✅ **SIEMPRE** agregar `@@index` en campos de búsqueda frecuente
- ✅ **SIEMPRE** paginar listas largas (más de 100 items)
- ✅ **SIEMPRE** usar `useTransition` para optimistic updates

---

## 🎯 PATRONES OBLIGATORIOS

### Server Action Pattern

```typescript
'use server'

import { getDemoUser } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  amount: z.number().positive()
});

export async function createSomething(formData: FormData) {
  try {
    // 1. Parse y validar
    const data = schema.parse({
      name: formData.get('name'),
      amount: Number(formData.get('amount'))
    });
    
    // 2. Obtener usuario (NUNCA desde formData)
    const user = await getDemoUser();
    
    // 3. Operación de BD
    const result = await prisma.model.create({
      data: { ...data, userId: user.id }
    });
    
    // 4. Revalidar cache
    revalidatePath('/route');
    
    // 5. Retorno estandarizado
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in createSomething:', error);
    return { success: false, error: error.message };
  }
}
```

### Component Pattern

```typescript
'use client'

import { useTransition } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';

export default function MyComponent() {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await serverAction(formData);
      if (result.success) {
        setIsOpen(false);
      } else {
        alert(result.error); // O usar toast
      }
    });
  };
  
  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <form action={handleSubmit}>
        {/* Usar componentes UI existentes */}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Modal>
  );
}
```

---

## 🔐 SEGURIDAD

### Autenticación/Autorización

- ✅ **SIEMPRE** obtener `userId` del servidor (no confiar en cliente)
- ✅ **SIEMPRE** filtrar queries por `userId`
- ✅ **SIEMPRE** verificar ownership antes de editar/eliminar

### Validación de Datos

- ✅ **SIEMPRE** validar en servidor (cliente es opcional)
- ✅ **SIEMPRE** sanitizar inputs (Zod hace esto)
- ✅ **SIEMPRE** usar Prisma (protege contra SQL injection)

---

## 📁 ESTRUCTURA DE ARCHIVOS

### Dónde Crear Cada Cosa

| Tipo | Ubicación | Ejemplo |
|------|-----------|---------|
| Server Action | `/src/actions/[feature]/` | `account-actions.ts` |
| Componente UI | `/src/components/ui/` | `Button.tsx` |
| Componente Feature | `/src/components/[feature]/` | `ProductCard.tsx` |
| Tipo/Interface | `/src/types/` | `product.types.ts` |
| Utilidad | `/src/utils/` | `date.ts` |
| Página | `/app/[route]/` | `page.tsx` |

### Imports Ordenados

```typescript
// 1. React y Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. Librerías externas
import { format } from 'date-fns';

// 3. Actions
import { createProduct } from '@/src/actions/accounts/account-actions';

// 4. Componentes
import { Button } from '@/src/components/ui/Button';

// 5. Tipos
import type { Product } from '@/src/types';

// 6. Utils
import { formatCurrency } from '@/src/utils/currency';
```

---

## 🐛 DEBUGGING

### Antes de Pedir Ayuda

1. ✅ Revisar console del navegador
2. ✅ Revisar terminal de Next.js
3. ✅ Verificar Network tab (Server Actions)
4. ✅ Revisar Prisma Studio (`npx prisma studio`)
5. ✅ Leer el error completo (no solo la primera línea)

### Logging

```typescript
// ✅ En desarrollo
console.log('[DEBUG] createProduct:', data);

// ✅ En producción (cuando tengas logging)
// logger.info('Product created', { productId: result.id });
```

---

## 🚀 PERFORMANCE

### Queries Eficientes

```typescript
// ❌ MAL - N+1 queries
const products = await prisma.product.findMany();
for (const product of products) {
  const institution = await prisma.institution.findUnique({
    where: { id: product.institutionId }
  });
}

// ✅ BIEN - 1 query con include
const products = await prisma.product.findMany({
  include: { institution: true }
});
```

### Prisma Select

```typescript
// ❌ MAL - Trae todos los campos
const user = await prisma.user.findUnique({
  where: { id }
});

// ✅ BIEN - Solo lo necesario
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true }
});
```

---

## 📝 COMMITS

### Formato de Commit

```
tipo(scope): descripción corta

Descripción larga opcional

Tipos válidos:
- feat: Nueva funcionalidad
- fix: Bug fix
- refactor: Refactorización
- docs: Documentación
- style: Formato (no afecta código)
- test: Tests
- chore: Mantenimiento
```

### Ejemplos

```
feat(accounts): agregar soporte para múltiples monedas
fix(summaries): corregir cálculo de intereses en Galicia parser
refactor(ui): migrar Button a Tailwind v4
docs(readme): actualizar instrucciones de setup
```

---

## 🔄 MIGRATIONS

### Workflow de Migraciones

```bash
# 1. Editar prisma/schema.prisma
# 2. Crear migración
npx prisma migrate dev --name add_new_field

# 3. Revisar archivos en prisma/migrations/
# 4. Commit migration files

# En producción:
npx prisma migrate deploy
```

### NUNCA

- ❌ Editar migrations creadas
- ❌ Usar `prisma db push` en producción
- ❌ Hacer migrations destructivas sin backup

---

## 🎨 UI/UX

### Principios

1. **Mínimo 3 estados**: default, hover, disabled
2. **Feedback inmediato**: loading states, optimistic updates
3. **Errores claros**: mensajes específicos, no genéricos
4. **Accesibilidad**: keyboard navigation, screen readers

### Checklist de Componente

- [ ] Usa tokens Tuli
- [ ] Tiene estados hover/focus/disabled
- [ ] Es accesible (aria-labels, roles)
- [ ] Funciona en móvil
- [ ] Loading state si es async

---

## 📖 CONSULTAR ANTES DE...

### Crear Algo Nuevo

| Acción | Documento a Consultar |
|--------|----------------------|
| Nuevo componente UI | `/src/components/ui/` + `DESIGN_SYSTEM.md` |
| Nuevo parser PDF | `/src/utils/pdf-parsers/` + `TECHNICAL_ANALYSIS.md` sección 10 |
| Nueva ruta | Revisar estructura en `/app/` |
| Nuevo tipo | `/src/types/` + Prisma schema |
| Nueva action | `/src/actions/` (ver patrón existente) |

---

## ⚡ QUICK WINS

### Cosas que Puedes Hacer Rápido

- ✅ Agregar categoría nueva (solo UI, BD ya soporta)
- ✅ Crear nota/recordatorio
- ✅ Agregar transacción manual
- ✅ Cambiar colores del tema (variables CSS)

### Cosas que Requieren Más Cuidado

- ⚠️ Nuevo tipo de producto (modificar schema)
- ⚠️ Nuevo parser de PDF (lógica compleja)
- ⚠️ Cambiar sistema de cuotas (afecta muchas partes)
- ⚠️ Modificar estructura de resúmenes

---

## 🎯 RESUMEN EJECUTIVO

**Para el Agente de IA:**

1. **Nunca toques** el schema de Prisma sin crear migración
2. **Siempre usa** los componentes UI existentes
3. **Siempre valida** con Zod en servidor
4. **Siempre obtén** el userId del servidor
5. **Siempre usa** tokens del Sistema Tuli
6. **Siempre retorna** `{ success, error?, data? }`
7. **Siempre revalida** el path después de mutaciones

**Si tienes duda:** Consulta `TECHNICAL_ANALYSIS.md` primero, luego este archivo.

---

**Última revisión:** 2026-01-14  
**Versión:** 1.0
