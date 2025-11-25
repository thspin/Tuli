// scripts/init-exchange-rates.ts
/**
 * Script para inicializar tipos de cambio en la base de datos
 *
 * Ejecutar con: npx tsx scripts/init-exchange-rates.ts
 */

import { PrismaClient, Currency } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('💱 Inicializando tipos de cambio...\n');

  try {
    // Tipos de cambio iniciales (valores aproximados)
    const exchangeRates = [
      // USD ↔ ARS
      {
        fromCurrency: Currency.USD,
        toCurrency: Currency.ARS,
        rate: 1350, // Dólar blue aproximado
      },
      {
        fromCurrency: Currency.ARS,
        toCurrency: Currency.USD,
        rate: 1 / 1350,
      },

      // BTC → USD
      {
        fromCurrency: Currency.BTC,
        toCurrency: Currency.USD,
        rate: 95000, // Bitcoin en USD
      },
      {
        fromCurrency: Currency.USD,
        toCurrency: Currency.BTC,
        rate: 1 / 95000,
      },

      // Stablecoins → USD (1:1)
      {
        fromCurrency: Currency.USDT,
        toCurrency: Currency.USD,
        rate: 1,
      },
      {
        fromCurrency: Currency.USD,
        toCurrency: Currency.USDT,
        rate: 1,
      },
      {
        fromCurrency: Currency.USDC,
        toCurrency: Currency.USD,
        rate: 1,
      },
      {
        fromCurrency: Currency.USD,
        toCurrency: Currency.USDC,
        rate: 1,
      },

      // BTC → ARS (directo)
      {
        fromCurrency: Currency.BTC,
        toCurrency: Currency.ARS,
        rate: 95000 * 1350,
      },
      {
        fromCurrency: Currency.ARS,
        toCurrency: Currency.BTC,
        rate: 1 / (95000 * 1350),
      },

      // USDT → ARS
      {
        fromCurrency: Currency.USDT,
        toCurrency: Currency.ARS,
        rate: 1350,
      },
      {
        fromCurrency: Currency.ARS,
        toCurrency: Currency.USDT,
        rate: 1 / 1350,
      },

      // USDC → ARS
      {
        fromCurrency: Currency.USDC,
        toCurrency: Currency.ARS,
        rate: 1350,
      },
      {
        fromCurrency: Currency.ARS,
        toCurrency: Currency.USDC,
        rate: 1 / 1350,
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const rate of exchangeRates) {
      try {
        await prisma.exchangeRate.create({
          data: rate,
        });
        console.log(`✓ ${rate.fromCurrency} → ${rate.toCurrency}: ${rate.rate}`);
        createdCount++;
      } catch (error) {
        // Si ya existe, lo actualizamos
        console.log(`→ ${rate.fromCurrency} → ${rate.toCurrency}: Ya existe, actualizando...`);
        updatedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Inicialización de tipos de cambio completada`);
    console.log(`   • Tipos de cambio creados: ${createdCount}`);
    console.log(`   • Tipos de cambio ya existentes: ${updatedCount}`);
    console.log('='.repeat(60) + '\n');

    // Mostrar resumen
    const totalRates = await prisma.exchangeRate.count();
    console.log(`📊 Total de tipos de cambio en DB: ${totalRates}\n`);

    console.log('💡 Nota: Estos son valores mock.');
    console.log('   En producción, deberías integrar APIs reales como:');
    console.log('   • https://dolarapi.com para USD/ARS');
    console.log('   • CoinGecko API para crypto\n');

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
