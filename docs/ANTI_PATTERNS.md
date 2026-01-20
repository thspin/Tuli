# ANTI_PATTERNS.md - Errores Comunes en Tuli v1

**Propósito:** Documentar errores reales encontrados y cómo evitarlos

---

## 🚨 ERRORES CRÍTICOS

### 1. Serialización de Fechas

❌ **ANTI-PATTERN:**
```typescript
// Server Action retorna Date directamente
export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id }
  });
  return product; // ❌ Contiene Date, no serializable
}
```

✅ **SOLUCIÓN:**
```typescript
export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id }
  });
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    expirationDate: product.expirationDate?.toISOString()
  };
}
```

### 2. Olvidar Actualizar Balance

❌ **ANTI-PATTERN:**
```typescript
export async function createTransaction(data) {
  // Solo crea la transacción
  await prisma.transaction.create({ data });
  // ❌ Falta actualizar balance del producto
}
```

✅ **SOLUCIÓN:**
```typescript
export async function createTransaction(data) {
  await prisma.$transaction(async (tx) => {
    // 1. Crear transacción
    const transaction = await tx.transaction.create({ data });
    
    // 2. Actualizar balance
    await tx.product.update({
      where: { id: data.fromProductId },
      data: {
        balance: { decrement: data.amount }
      }
    });
  });
}
```

### 3. No Filtrar por userId

❌ **ANTI-PATTERN:**
```typescript
export async function deleteProduct(id: string) {
  // ❌ Cualquiera puede borrar cualquier producto
  await prisma.product.delete({ where: { id } });
}
```

✅ **SOLUCIÓN:**
```typescript
export async function deleteProduct(id: string) {
  const user = await getDemoUser();
  
  // Verificar ownership
  const product = await prisma.product.findFirst({
    where: { id, userId: user.id }
  });
  
  if (!product) {
    throw new Error('Producto no encontrado o sin permisos');
  }
  
  await prisma.product.delete({ where: { id } });
}
```

---

## ⚠️ ERRORES DE PRISMA

### 4. N+1 Queries

❌ **ANTI-PATTERN:**
```typescript
const products = await prisma.product.findMany();
for (const product of products) {
  const transactions = await prisma.transaction.findMany({
    where: { fromProductId: product.id }
  });
  // ❌ 1 + N queries
}
```

✅ **SOLUCIÓN:**
```typescript
const products = await prisma.product.findMany({
  include: {
    transactionsOrigin: true // 1 query con JOIN
  }
});
```

### 5. No Usar Transacciones de BD

❌ **ANTI-PATTERN:**
```typescript
// Transferencia entre cuentas
await prisma.product.update({
  where: { id: fromId },
  data: { balance: { decrement: amount } }
});

// ❌ Si falla aquí, el dinero "desaparece"
await prisma.product.update({
  where: { id: toId },
  data: { balance: { increment: amount } }
});
```

✅ **SOLUCIÓN:**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.product.update({
    where: { id: fromId },
    data: { balance: { decrement: amount } }
  });
  
  await tx.product.update({
    where: { id: toId },
    data: { balance: { increment: amount } }
  });
});
```

### 6. Olvidar revalidatePath

❌ **ANTI-PATTERN:**
```typescript
export async function updateProduct(id, data) {
  await prisma.product.update({ where: { id }, data });
  // ❌ El cliente no ve los cambios
}
```

✅ **SOLUCIÓN:**
```typescript
import { revalidatePath } from 'next/cache';

export async function updateProduct(id, data) {
  await prisma.product.update({ where: { id }, data });
  revalidatePath('/accounts');
  revalidatePath(`/accounts/${id}`);
}
```

---

## 🎨 ERRORES DE UI

### 7. Hardcodear Estilos

❌ **ANTI-PATTERN:**
```tsx
<div className="rounded-lg shadow-md p-6 bg-white">
  {/* ❌ No usa sistema Tuli */}
</div>
```

✅ **SOLUCIÓN:**
```tsx
<div className="rounded-tuli-lg shadow-tuli-md p-card bg-card">
  {/* ✅ Usa tokens del sistema */}
</div>
```

### 8. No Usar Componentes Existentes

❌ **ANTI-PATTERN:**
```tsx
<button
  className="px-4 py-2 bg-blue-500 text-white rounded"
  onClick={handleClick}
>
  Guardar
</button>
```

✅ **SOLUCIÓN:**
```tsx
import { Button } from '@/src/components/ui/Button';

<Button variant="primary" onClick={handleClick}>
  Guardar
</Button>
```

### 9. No Manejar Loading States

❌ **ANTI-PATTERN:**
```tsx
const handleSubmit = async () => {
  await createProduct(data); // Usuario no sabe si está procesando
};

return <Button onClick={handleSubmit}>Crear</Button>;
```

✅ **SOLUCIÓN:**
```tsx
const [isPending, startTransition] = useTransition();

const handleSubmit = async () => {
  startTransition(async () => {
    await createProduct(data);
  });
};

return (
  <Button onClick={handleSubmit} disabled={isPending}>
    {isPending ? 'Creando...' : 'Crear'}
  </Button>
);
```

---

## 🔄 ERRORES DE ESTADO

### 10. Mutar Props Directamente

❌ **ANTI-PATTERN:**
```tsx
function ProductCard({ product }) {
  const handleEdit = () => {
    product.name = 'Nuevo nombre'; // ❌ Mutación directa
    setProducts([...products]);
  };
}
```

✅ **SOLUCIÓN:**
```tsx
function ProductCard({ product, onUpdate }) {
  const handleEdit = async () => {
    const result = await updateProduct(product.id, { name: 'Nuevo nombre' });
    if (result.success) {
      onUpdate(result.data); // Callback al padre
    }
  };
}
```

### 11. No Sincronizar Estado Local con Servidor

❌ **ANTI-PATTERN:**
```tsx
const [balance, setBalance] = useState(initialBalance);

const handleTransaction = async () => {
  await createTransaction(data);
  // ❌ Balance local desactualizado
};
```

✅ **SOLUCIÓN:**
```tsx
// Opción 1: Revalidar desde servidor
const handleTransaction = async () => {
  await createTransaction(data);
  // revalidatePath en la action actualiza automáticamente
};

// Opción 2: Optimistic update
const handleTransaction = async () => {
  setBalance(prev => prev - amount); // Optimistic
  const result = await createTransaction(data);
  if (!result.success) {
    setBalance(prev => prev + amount); // Rollback
  }
};
```

---

## 📝 ERRORES DE VALIDACIÓN

### 12. Validar Solo en Cliente

❌ **ANTI-PATTERN:**
```tsx
// Solo validación en cliente
const handleSubmit = (e) => {
  if (!name || amount <= 0) {
    alert('Datos inválidos');
    return;
  }
  createProduct({ name, amount }); // ❌ Puede bypassearse
};
```

✅ **SOLUCIÓN:**
```typescript
// Server Action con Zod
const schema = z.object({
  name: z.string().min(1),
  amount: z.number().positive()
});

export async function createProduct(data) {
  const validated = schema.parse(data); // ✅ Valida en servidor
  // ...
}
```

### 13. Errores Genéricos

❌ **ANTI-PATTERN:**
```typescript
try {
  await prisma.product.create({ data });
} catch (error) {
  return { success: false, error: 'Error' }; // ❌ No ayuda
}
```

✅ **SOLUCIÓN:**
```typescript
try {
  await prisma.product.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    return { success: false, error: 'Ya existe un producto con ese nombre' };
  }
  console.error('Error creating product:', error);
  return { success: false, error: 'No se pudo crear el producto' };
}
```

---

## 💸 ERRORES DE LÓGICA FINANCIERA

### 14. No Manejar Cuotas Correctamente

❌ **ANTI-PATTERN:**
```typescript
// Crear solo la primera cuota
await prisma.transaction.create({
  data: {
    amount,
    installmentNumber: 1,
    installmentTotal: 6
    // ❌ Falta installmentId y cuotas futuras
  }
});
```

✅ **SOLUCIÓN:**
```typescript
import { v4 as uuidv4 } from 'uuid';
import { addMonths } from 'date-fns';

const installmentId = uuidv4();
const transactions = [];

for (let i = 1; i <= installmentTotal; i++) {
  transactions.push({
    amount: installmentAmount,
    date: addMonths(new Date(), i - 1),
    installmentNumber: i,
    installmentTotal,
    installmentId, // ✅ ID común
    // ...
  });
}

await prisma.transaction.createMany({ data: transactions });
```

### 15. No Actualizar Resúmenes

❌ **ANTI-PATTERN:**
```typescript
// Crear transacción en tarjeta de crédito
await prisma.transaction.create({ data });
// ❌ No asocia al resumen del mes
```

✅ **SOLUCIÓN:**
```typescript
const transaction = await prisma.transaction.create({ data });

// Buscar o crear resumen del mes
const summary = await findOrCreateSummary(productId, year, month);

// Crear SummaryItem
await prisma.summaryItem.create({
  data: {
    summaryId: summary.id,
    transactionId: transaction.id,
    amount: transaction.amount
  }
});

// Actualizar total del resumen
await updateSummaryTotal(summary.id);
```

---

## 🔍 ERRORES DE PARSEO DE PDF

### 16. No Manejar Formatos Diferentes

❌ **ANTI-PATTERN:**
```typescript
// Asumir formato único
const amount = parseFloat(line.split(' ')[2]);
// ❌ Falla si el formato cambia
```

✅ **SOLUCIÓN:**
```typescript
// Múltiples patterns
const patterns = [
  /\$\s*([\d.,]+)/,           // $ 1.234,56
  /([\d.,]+)\s*ARS/,          // 1.234,56 ARS
  /Total:\s*([\d.,]+)/        // Total: 1.234,56
];

for (const pattern of patterns) {
  const match = line.match(pattern);
  if (match) {
    return parseArgentineNumber(match[1]);
  }
}
```

### 17. No Normalizar Descripciones

❌ **ANTI-PATTERN:**
```typescript
// Comparar descripciones raw
if (pdfDesc === dbDesc) { // ❌ Casi nunca coincide
  // match
}
```

✅ **SOLUCIÓN:**
```typescript
function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Sin tildes
    .replace(/[^\w\s]/g, '') // Sin símbolos
    .replace(/\s+/g, ' ') // Espacios únicos
    .trim();
}

const similarity = stringSimilarity(
  normalizeDescription(pdfDesc),
  normalizeDescription(dbDesc)
);
```

---

## 🎯 ERRORES DE TIPOS

### 18. Tipos Incorrectos de Prisma

❌ **ANTI-PATTERN:**
```typescript
// Importar tipo de Prisma en componente cliente
import type { Product } from '@prisma/client';

function ProductCard({ product }: { product: Product }) {
  // ❌ Incluye Date, BigInt no serializables
}
```

✅ **SOLUCIÓN:**
```typescript
// Crear tipo serializado
import type { ProductWithInstitution } from '@/src/types';

function ProductCard({ product }: { product: ProductWithInstitution }) {
  // ✅ Tipo serializable (Date → string)
}
```

### 19. Any en Catch

❌ **ANTI-PATTERN:**
```typescript
try {
  // ...
} catch (error) {
  console.log(error.message); // ❌ error: any
}
```

✅ **SOLUCIÓN:**
```typescript
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log('Error desconocido:', error);
  }
}
```

---

## 🚀 ERRORES DE PERFORMANCE

### 20. Cargar Datos Innecesarios

❌ **ANTI-PATTERN:**
```typescript
const products = await prisma.product.findMany({
  include: {
    transactionsOrigin: true, // ❌ Miles de transacciones
    transactionsDest: true,
    summaries: {
      include: {
        items: true,
        adjustments: true
      }
    }
  }
});
```

✅ **SOLUCIÓN:**
```typescript
// Solo cargar lo necesario
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    balance: true,
    currency: true,
    institution: {
      select: { id: true, name: true }
    }
  }
});

// Cargar transacciones por separado si es necesario
```

---

## 📋 CHECKLIST ANTES DE COMMIT

Antes de hacer commit, verifica:

- [ ] ✅ No hay `any` sin justificación
- [ ] ✅ Todas las Server Actions tienen validación Zod
- [ ] ✅ No hay hardcoded colors/spacing
- [ ] ✅ Componentes usan primitivos de `/ui/`
- [ ] ✅ No hay console.log en producción
- [ ] ✅ Hay loading states en operaciones async
- [ ] ✅ Hay manejo de errores con mensajes claros
- [ ] ✅ Se actualiza balance si hay transacción
- [ ] ✅ Se usa `revalidatePath` después de mutaciones
- [ ] ✅ Tipos son serializables (no Date/BigInt directos)

---

**Última actualización:** 2026-01-14  
**Versión:** 1.0
