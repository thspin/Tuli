# Scripts de Mantenimiento - Tuli v1

Este directorio contiene scripts de utilidad para mantenimiento y administración de la base de datos.

---

## 📋 Scripts Disponibles

### 1. `clean-database.ts` - Limpieza de Base de Datos

Elimina todos los datos transaccionales y derivados, manteniendo la estructura base de instituciones y productos.

#### ¿Qué conserva?
- ✅ Usuarios
- ✅ Instituciones Financieras
- ✅ Productos Financieros (con balance reseteado a 0)
- ✅ Categorías del sistema

#### ¿Qué elimina?
- ❌ Todas las transacciones
- ❌ Resúmenes de tarjetas (summaries, items, adjustments)
- ❌ Servicios y facturas
- ❌ Notas
- ❌ Categorías personalizadas (no-sistema)
- ❌ Deudas (modelo deprecated)
- ❌ Tipos de cambio antiguos (> 30 días)

#### Uso:

```bash
npm run db:clean
```

**⚠️ PRECAUCIÓN:** Esta acción es **IRREVERSIBLE**. Asegúrate de tener un backup si es necesario.

#### Ejemplo de Output:

```
🧹 Iniciando limpieza de base de datos...

📋 1. Eliminando servicios y facturas...
   ✓ 15 reglas de pago eliminadas
   ✓ 42 facturas eliminadas
   ✓ 8 servicios eliminados

💳 2. Eliminando resúmenes de tarjetas...
   ✓ 24 resúmenes eliminados (+ items y ajustes por cascade)

💸 3. Eliminando transacciones...
   ✓ 1,247 transacciones eliminadas

💰 4. Reseteando balances de productos...
   ✓ 12 productos reseteados a balance 0

📝 5. Eliminando notas...
   ✓ 5 notas eliminadas

🏷️  6. Eliminando categorías personalizadas...
   ✓ 7 categorías personalizadas eliminadas
   ✓ Categorías del sistema mantenidas

💳 7. Eliminando deudas (modelo deprecated)...
   ✓ 0 deudas eliminadas

💱 8. Limpiando tipos de cambio antiguos...
   ✓ 23 tipos de cambio antiguos eliminados (> 30 días)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LIMPIEZA COMPLETADA EXITOSAMENTE

📊 DATOS CONSERVADOS:
   • Usuarios: 1
   • Instituciones Financieras: 5
   • Productos Financieros: 12
   • Categorías del Sistema: 3

📊 DATOS ELIMINADOS:
   • Transacciones: 1,247
   • Resúmenes de Tarjetas: 24
   • Servicios: 8
   • Facturas: 42
   • Notas: 5
   • Categorías Personalizadas: 7
   • Deudas: 0
   • Tipos de Cambio Antiguos: 23

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Script finalizado correctamente
```

---

## 🔧 Requisitos

- Node.js 20+
- PostgreSQL con base de datos configurada
- Variables de entorno configuradas (`.env`)

---

## 📝 Cómo crear nuevos scripts

1. Crear archivo `.ts` en este directorio
2. Importar Prisma Client:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   ```
3. Escribir la lógica del script
4. Agregar script en `package.json`:
   ```json
   "scripts": {
     "mi-script": "tsx scripts/mi-script.ts"
   }
   ```
5. Documentar el script en este README

---

## 🛡️ Mejores Prácticas

### Transacciones
Para operaciones complejas, usa transacciones de Prisma:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.transaction.deleteMany({ ... });
  await tx.product.updateMany({ ... });
});
```

### Logs
Siempre incluye logs claros:

```typescript
console.log('🔄 Procesando...');
console.log(`✓ ${count} registros procesados`);
console.error('❌ Error:', error);
```

### Try-Catch
Captura errores y desconecta Prisma:

```typescript
try {
  // Lógica del script
} catch (error) {
  console.error('Error:', error);
  throw error;
} finally {
  await prisma.$disconnect();
}
```

### Confirmaciones
Para operaciones destructivas, pide confirmación:

```typescript
import readline from 'readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const answer = await rl.question('¿Estás seguro? (yes/no): ');
if (answer !== 'yes') {
  console.log('Operación cancelada');
  process.exit(0);
}
```

---

## 🚀 Próximos Scripts Sugeridos

- [ ] `seed-database.ts` - Insertar datos de demo
- [ ] `export-data.ts` - Exportar datos a JSON/CSV
- [ ] `import-data.ts` - Importar datos desde JSON/CSV
- [ ] `verify-integrity.ts` - Verificar integridad de datos
- [ ] `migrate-data.ts` - Migrar datos entre versiones de schema
- [ ] `backup-database.ts` - Crear backup de la BD

---

**Última actualización:** 2026-01-15  
**Versión:** 1.0
