# SCALABILITY.md - Guía de Escalabilidad y Modernidad

**Estado Actual:** MVP (Fase 2 - 80%)  
**Stack:** Moderno y vigente para 2026  
**Próximo Paso:** Preparación para producción multi-usuario

---

## ✅ Fortalezas del Stack Actual

### Framework y Arquitectura
- ✅ **Next.js 16.1** (App Router) - Última versión estable
- ✅ **React 19.2** - Server Components nativos
- ✅ **TypeScript 5.0+** - Type safety end-to-end
- ✅ **Prisma 6.0** - ORM moderno con excelente DX
- ✅ **Tailwind CSS 3.4** - Sistema de diseño escalable

### Arquitectura en Capas
```
✅ Separación clara: app → components → actions → lib
✅ Server Actions (sin necesidad de API routes)
✅ Organización por features (accounts, transactions, etc.)
✅ Tipos centralizados en /types
✅ Sistema de diseño documentado (DESIGN_SYSTEM.md)
```

### Conclusión
**Tu stack ES moderno y escalable.** No necesitas reescribir nada, solo añadir las piezas que faltan para producción.

---

## ⚠️ Áreas Críticas para Producción

### 1. Autenticación Real (CRÍTICO)

**Problema Actual:**
```typescript
// src/lib/auth.ts
export async function getDemoUser() {
  return prisma.user.findUnique({
    where: { email: 'demo@financetracker.com' }
  });
}
```

**Solución Recomendada: Clerk (más fácil)**

```bash
npm install @clerk/nextjs
```

```typescript
// src/lib/auth.ts
import { auth } from "@clerk/nextjs/server";

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('No autenticado');
  }
  
  return prisma.user.findUnique({
    where: { clerkId: userId }
  });
}
```

**Alternativa: NextAuth.js (más control)**

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";

export const { auth, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    }
  }
});
```

**Migración del Schema:**
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  clerkId      String?   @unique  // Si usas Clerk
  // o
  emailVerified DateTime? // Si usas NextAuth
  accounts     Account[] // NextAuth
  sessions     Session[] // NextAuth
  // ... resto igual
}
```

---

### 2. Paginación (CRÍTICO para escalar)

**Problema Actual:**
```typescript
// ❌ Sin límite - puede explotar con miles de transacciones
const transactions = await prisma.transaction.findMany({
  where: { userId }
});
```

**Solución: Cursor-Based Pagination**

```typescript
// src/actions/transactions/transaction-actions.ts
export async function getTransactions({
  cursor,
  limit = 50,
  userId
}: {
  cursor?: string;
  limit?: number;
  userId: string;
}) {
  const transactions = await prisma.transaction.findMany({
    take: limit + 1, // +1 para saber si hay más
    cursor: cursor ? { id: cursor } : undefined,
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const hasMore = transactions.length > limit;
  const results = hasMore ? transactions.slice(0, limit) : transactions;
  const nextCursor = hasMore ? results[results.length - 1].id : undefined;

  return {
    transactions: results,
    nextCursor,
    hasMore
  };
}
```

**Componente Cliente:**
```typescript
'use client'

export function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [cursor, setCursor] = useState<string>();
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const result = await getTransactions({ cursor });
    setTransactions([...transactions, ...result.transactions]);
    setCursor(result.nextCursor);
    setHasMore(result.hasMore);
  };

  return (
    <>
      {transactions.map(tx => <TransactionItem key={tx.id} tx={tx} />)}
      {hasMore && <Button onClick={loadMore}>Cargar más</Button>}
    </>
  );
}
```

---

### 3. Caché y Performance

**Implementar:**

```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedProducts = unstable_cache(
  async (userId: string) => {
    return prisma.product.findMany({
      where: { userId },
      include: { institution: true }
    });
  },
  ['products'], // cache key
  {
    revalidate: 60, // 60 segundos
    tags: ['products'] // para invalidar manualmente
  }
);

// Invalidar cuando se modifica
import { revalidateTag } from 'next/cache';

export async function createProduct(data) {
  const product = await prisma.product.create({ data });
  revalidateTag('products'); // ← Invalida el cache
  return product;
}
```

---

### 4. Error Tracking (ESENCIAL)

**Sentry Setup:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // No enviar errores en desarrollo
    if (process.env.NODE_ENV === 'development') return null;
    return event;
  }
});
```

**Usar en Server Actions:**
```typescript
import * as Sentry from "@sentry/nextjs";

export async function createProduct(data) {
  try {
    return await prisma.product.create({ data });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { action: 'createProduct' },
      extra: { data }
    });
    throw error;
  }
}
```

---

### 5. Rate Limiting

**Con Upstash Redis:**

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests / 10s
  analytics: true,
});

export async function middleware(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString()
      }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*', // Solo para APIs públicas
};
```

---

### 6. Tests (RECOMENDADO)

**Setup Vitest:**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/actions/account-actions.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createProduct } from '@/src/actions/accounts/account-actions';

describe('createProduct', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.product.deleteMany();
  });

  it('should create a product successfully', async () => {
    const formData = new FormData();
    formData.append('name', 'Test Card');
    formData.append('type', 'CREDIT_CARD');

    const result = await createProduct(formData);

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Test Card');
  });

  it('should validate required fields', async () => {
    const formData = new FormData();
    // Sin name

    const result = await createProduct(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});
```

**Tests Mínimos Recomendados:**
- ✅ Crear producto
- ✅ Crear transacción + actualizar balance
- ✅ Transferencia entre cuentas (atomic)
- ✅ Generación de cuotas
- ✅ Parsers de PDF (con PDFs de prueba)

---

### 7. Background Jobs (Para operaciones pesadas)

**Con Inngest (Recomendado):**

```bash
npm install inngest
```

```typescript
// src/lib/inngest.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "tuli-v1" });

// src/inngest/functions.ts
export const generateMonthlyReports = inngest.createFunction(
  { id: "generate-monthly-reports", name: "Generate Monthly Reports" },
  { cron: "0 0 1 * *" }, // 1ro de cada mes a las 00:00
  async ({ step }) => {
    const users = await step.run('fetch-users', async () => {
      return prisma.user.findMany({ select: { id: true } });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        // Generar resúmenes automáticos
        await generateSummariesForUser(user.id);
      });
    }

    return { processed: users.length };
  }
);
```

**Alternativas:**
- BullMQ (necesita Redis)
- Trigger.dev (similar a Inngest)
- Next.js Cron Routes (limitado)

---

## 📊 Roadmap de Escalabilidad

### Fase Actual → Producción (1-2 meses)

| Prioridad | Tarea | Esfuerzo | Impacto |
|-----------|-------|----------|---------|
| 🔴 CRÍTICO | Implementar autenticación real | 1 semana | 🚀 Alto |
| 🔴 CRÍTICO | Agregar paginación a listas | 3 días | 🚀 Alto |
| 🟡 ALTO | Setup Sentry para error tracking | 1 día | ⚡ Medio |
| 🟡 ALTO | Agregar rate limiting | 2 días | ⚡ Medio |
| 🟢 MEDIO | Tests de funcionalidades críticas | 1 semana | 📈 Medio |
| 🟢 MEDIO | Background jobs (cron) | 3 días | 📈 Bajo |

### Producción → Escala (3-6 meses)

| Tarea | Descripción |
|-------|-------------|
| **Monorepo** | Migrar a Turborepo cuando agregues mobile |
| **CDN** | Usar Cloudflare/Vercel Edge para assets |
| **Database Pooling** | PgBouncer para más conexiones |
| **Full-Text Search** | Postgres FTS o Algolia para búsquedas |
| **Webhooks** | Para integraciones con bancos (Open Banking) |

---

## 🔧 Mejoras Incrementales

### Database Indices (Ya agregados en TECHNICAL_ANALYSIS.md)

```prisma
// ✅ Ya documentados
@@index([userId, date])
@@index([fromProductId, date])
@@index([installmentId])
```

### API de Conversión de Monedas (Ya documentado)

Ver `TECHNICAL_ANALYSIS.md` sección 11.3 - Limitaciones de Conversión de Monedas.

### Variables de Entorno (Ya documentado)

Archivo `.env.example` creado con todas las variables necesarias.

---

## 🚀 Feature Flags (Recomendado para escalar)

```typescript
// src/lib/features.ts
export const features = {
  advancedAnalytics: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true',
  pdfImport: true,
  multiCurrency: true,
  backgroundJobs: process.env.FEATURE_BG_JOBS === 'true',
  newUI: process.env.NEXT_PUBLIC_NEW_UI === 'true'
};

// Usar en componentes
if (features.advancedAnalytics) {
  return <AdvancedCharts />;
}
```

**Beneficios:**
- Deploy gradual de features
- A/B testing
- Rollback instantáneo
- Testing en producción con % de usuarios

---

## 📈 Métricas a Trackear

### Performance
- ⏱️ **Time to First Byte (TTFB)**: < 600ms
- ⏱️ **Largest Contentful Paint (LCP)**: < 2.5s
- ⏱️ **First Input Delay (FID)**: < 100ms
- ⏱️ **Cumulative Layout Shift (CLS)**: < 0.1

### Funcionalidad
- 📊 Transacciones creadas/día
- 📊 PDFs importados exitosamente
- 📊 Errores de parsing de PDF
- 📊 Usuarios activos diarios (DAU)
- 📊 Tasa de conversión signup → primera transacción

### Infraestructura
- 💾 Database size
- 💾 Average query time
- 💾 Connection pool usage
- 🔥 Error rate (Sentry)

**Setup con Vercel Analytics:**
```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🎯 Checklist Pre-Producción

### Seguridad
- [ ] Autenticación implementada (Clerk/NextAuth)
- [ ] Rate limiting en endpoints públicos
- [ ] CSRF protection (Next.js lo hace por defecto)
- [ ] Sanitización de inputs (Zod valida)
- [ ] HTTPS forzado (Vercel lo hace por defecto)

### Performance
- [ ] Paginación en todas las listas
- [ ] Caché implementado (`unstable_cache`)
- [ ] Lazy loading de componentes pesados
- [ ] Imágenes optimizadas con `next/image`
- [ ] Bundle size < 200KB first load

### Monitoreo
- [ ] Sentry configurado
- [ ] Logging estructurado
- [ ] Alertas de errores críticos
- [ ] Dashboard de métricas

### Base de Datos
- [ ] Migraciones versionadas en Git
- [ ] Backups automáticos (Vercel Postgres lo hace)
- [ ] Monitoreo de queries lentas
- [ ] Connection pooling configurado

### Testing
- [ ] Tests de funcionalidades críticas
- [ ] CI/CD con tests automáticos
- [ ] Smoke tests post-deploy

---

## 🔮 Futuro: Arquitectura Multi-Tenant

Cuando tengas miles de usuarios:

```prisma
// Agregar tenant/organization
model Organization {
  id      String @id @default(uuid())
  name    String
  plan    Plan   @default(FREE)
  users   User[]
  // ...
}

model User {
  id             String       @id
  organizationId String
  organization   Organization @relation(...)
  // ...
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}
```

**Row-Level Security (RLS) en Postgres:**
```sql
-- Ejemplo (requiere migraciones manuales)
CREATE POLICY user_isolation ON transactions
  USING (user_id = current_setting('app.user_id')::uuid);
```

---

## 📚 Recursos Adicionales

### Librerías Recomendadas
- **Validación**: [Zod](https://zod.dev) ✅ (ya usado)
- **Fechas**: [date-fns](https://date-fns.org) ✅ (ya usado)
- **Autenticación**: [Clerk](https://clerk.com) o [NextAuth](https://next-auth.js.org)
- **Monitoring**: [Sentry](https://sentry.io)
- **Background Jobs**: [Inngest](https://inngest.com)
- **Rate Limiting**: [Upstash](https://upstash.com)

### Hosting Recomendado
- **App**: Vercel (mejor DX con Next.js)
- **Database**: Vercel Postgres o Supabase
- **Redis**: Upstash Redis (serverless)
- **Storage**: Vercel Blob o Cloudflare R2

---

## 🎓 Conclusión

**Tu proyecto está bien arquitecturado.** El stack es moderno y ya sigue best practices. Solo necesitas:

1. ✅ Implementar autenticación real (1 semana)
2. ✅ Agregar paginación (3 días)
3. ✅ Setup monitoring con Sentry (1 día)
4. ✅ Tests de funcionalidades críticas (1 semana)

**Total:** ~3 semanas para estar production-ready.

El resto (background jobs, rate limiting, feature flags) son mejoras incrementales que puedes agregar después del lanzamiento.

---

**Para vibe coding exitoso:**
1. Lee `RULES.md` antes de generar código
2. Consulta `ANTI_PATTERNS.md` para evitar errores comunes
3. Usa `TECHNICAL_ANALYSIS.md` como referencia
4. Sé específico en prompts: *"Crea un componente siguiendo RULES.md sección de UI"*

---

**Última actualización:** 2026-01-14  
**Versión:** 1.0
