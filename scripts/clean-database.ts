/**
 * Script de Limpieza de Base de Datos
 * 
 * Este script elimina todos los datos transaccionales y derivados,
 * manteniendo únicamente:
 * - Usuarios
 * - Instituciones Financieras
 * - Productos Financieros
 * 
 * Se elimina:
 * - Todas las transacciones
 * - Resúmenes de tarjetas (summaries, summary items, adjustments)
 * - Servicios y facturas
 * - Notas
 * - Categorías no-sistema
 * - Deudas (modelo deprecated)
 * 
 * USO:
 * npx tsx scripts/clean-database.ts
 * 
 * PRECAUCIÓN: Esta acción es IRREVERSIBLE en base de datos sin backups.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...\n');

  try {
    // ============================================
    // PASO 1: Eliminar Servicios y Facturas
    // ============================================
    console.log('📋 1. Eliminando servicios y facturas...');
    
    // Primero eliminar las reglas de pago (relación con servicios)
    const deletedPaymentRules = await prisma.servicePaymentRule.deleteMany();
    console.log(`   ✓ ${deletedPaymentRules.count} reglas de pago eliminadas`);

    // Eliminar facturas
    const deletedBills = await prisma.serviceBill.deleteMany();
    console.log(`   ✓ ${deletedBills.count} facturas eliminadas`);

    // Eliminar servicios
    const deletedServices = await prisma.service.deleteMany();
    console.log(`   ✓ ${deletedServices.count} servicios eliminados\n`);

    // ============================================
    // PASO 2: Eliminar Resúmenes de Tarjetas
    // ============================================
    console.log('💳 2. Eliminando resúmenes de tarjetas...');
    
    // Los SummaryItem y SummaryAdjustment se eliminan por cascade
    // al eliminar CreditCardSummary gracias a onDelete: Cascade
    const deletedSummaries = await prisma.creditCardSummary.deleteMany();
    console.log(`   ✓ ${deletedSummaries.count} resúmenes eliminados (+ items y ajustes por cascade)\n`);

    // ============================================
    // PASO 3: Eliminar Transacciones
    // ============================================
    console.log('💸 3. Eliminando transacciones...');
    
    const deletedTransactions = await prisma.transaction.deleteMany();
    console.log(`   ✓ ${deletedTransactions.count} transacciones eliminadas\n`);

    // ============================================
    // PASO 4: Resetear Balances de Productos
    // ============================================
    console.log('💰 4. Reseteando balances de productos...');
    
    const updatedProducts = await prisma.financialProduct.updateMany({
      data: {
        balance: 0
      }
    });
    console.log(`   ✓ ${updatedProducts.count} productos reseteados a balance 0\n`);

    // ============================================
    // PASO 5: Eliminar Notas
    // ============================================
    console.log('📝 5. Eliminando notas...');
    
    const deletedNotes = await prisma.note.deleteMany();
    console.log(`   ✓ ${deletedNotes.count} notas eliminadas\n`);

    // ============================================
    // PASO 6: Eliminar Categorías Custom (mantener las del sistema)
    // ============================================
    console.log('🏷️  6. Eliminando categorías personalizadas...');
    
    const deletedCategories = await prisma.category.deleteMany({
      where: {
        isSystem: false // Solo eliminar las que NO son del sistema
      }
    });
    console.log(`   ✓ ${deletedCategories.count} categorías personalizadas eliminadas`);
    console.log(`   ✓ Categorías del sistema mantenidas\n`);

    // ============================================
    // PASO 7: Eliminar Deudas (modelo deprecated)
    // ============================================
    console.log('💳 7. Eliminando deudas (modelo deprecated)...');
    
    const deletedDebts = await prisma.debt.deleteMany();
    console.log(`   ✓ ${deletedDebts.count} deudas eliminadas\n`);

    // ============================================
    // PASO 8: Eliminar ExchangeRates antiguos (opcional)
    // ============================================
    console.log('💱 8. Limpiando tipos de cambio antiguos...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deletedExchangeRates = await prisma.exchangeRate.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo
        }
      }
    });
    console.log(`   ✓ ${deletedExchangeRates.count} tipos de cambio antiguos eliminados (> 30 días)\n`);

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE\n');
    
    // Contar lo que queda
    const remainingInstitutions = await prisma.financialInstitution.count();
    const remainingProducts = await prisma.financialProduct.count();
    const remainingSystemCategories = await prisma.category.count({ where: { isSystem: true } });
    const remainingUsers = await prisma.user.count();

    console.log('📊 DATOS CONSERVADOS:');
    console.log(`   • Usuarios: ${remainingUsers}`);
    console.log(`   • Instituciones Financieras: ${remainingInstitutions}`);
    console.log(`   • Productos Financieros: ${remainingProducts}`);
    console.log(`   • Categorías del Sistema: ${remainingSystemCategories}\n`);

    console.log('📊 DATOS ELIMINADOS:');
    console.log(`   • Transacciones: ${deletedTransactions.count}`);
    console.log(`   • Resúmenes de Tarjetas: ${deletedSummaries.count}`);
    console.log(`   • Servicios: ${deletedServices.count}`);
    console.log(`   • Facturas: ${deletedBills.count}`);
    console.log(`   • Notas: ${deletedNotes.count}`);
    console.log(`   • Categorías Personalizadas: ${deletedCategories.count}`);
    console.log(`   • Deudas: ${deletedDebts.count}`);
    console.log(`   • Tipos de Cambio Antiguos: ${deletedExchangeRates.count}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ ERROR durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
cleanDatabase()
  .then(() => {
    console.log('\n✨ Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });
