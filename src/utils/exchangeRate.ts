// lib/exchangeRate.ts
import { Currency } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Servicio para manejar tipos de cambio entre monedas
 */

export interface ExchangeRateData {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  timestamp: Date;
}

/**
 * Obtiene el tipo de cambio más reciente entre dos monedas
 */
export async function getLatestExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number | null> {
  // Si son la misma moneda, el cambio es 1:1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return exchangeRate ? Number(exchangeRate.rate) : null;
  } catch (error) {
    console.error('Error obteniendo tipo de cambio:', error);
    return null;
  }
}

/**
 * Obtiene todos los tipos de cambio más recientes
 * Retorna un mapa de "FROM_TO" -> rate
 */
export async function getAllLatestExchangeRates(): Promise<Record<string, number>> {
  try {
    // Obtener todos los pares de monedas únicos
    const rates = await prisma.$queryRaw<Array<{
      fromCurrency: string;
      toCurrency: string;
      rate: number;
    }>>`
      SELECT DISTINCT ON ("fromCurrency", "toCurrency")
        "fromCurrency",
        "toCurrency",
        rate
      FROM "ExchangeRate"
      ORDER BY "fromCurrency", "toCurrency", timestamp DESC
    `;

    const ratesMap: Record<string, number> = {};

    rates.forEach((rate) => {
      const key = `${rate.fromCurrency}_${rate.toCurrency}`;
      ratesMap[key] = Number(rate.rate);
    });

    return ratesMap;
  } catch (error) {
    console.error('Error obteniendo tipos de cambio:', error);
    return {};
  }
}

/**
 * Guarda un nuevo tipo de cambio en la base de datos
 */
export async function saveExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  rate: number
): Promise<void> {
  try {
    await prisma.exchangeRate.create({
      data: {
        fromCurrency,
        toCurrency,
        rate,
      },
    });
  } catch (error) {
    console.error('Error guardando tipo de cambio:', error);
    throw error;
  }
}

/**
 * Convierte un monto de una moneda a otra usando el tipo de cambio más reciente
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number | null> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = await getLatestExchangeRate(fromCurrency, toCurrency);

  if (rate === null) {
    return null;
  }

  return amount * rate;
}

/**
 * Obtiene el tipo de cambio USD/ARS más reciente
 * Esta es la conversión principal que se mostrará en la UI
 */
export async function getUsdToArsRate(): Promise<number | null> {
  return await getLatestExchangeRate(Currency.USD, Currency.ARS);
}

/**
 * Obtiene el tipo de cambio ARS/USD más reciente
 */
export async function getArsToUsdRate(): Promise<number | null> {
  return await getLatestExchangeRate(Currency.ARS, Currency.USD);
}

/**
 * MOCK: Obtiene tipos de cambio desde una API externa
 * TODO: Implementar integración con API real (ej: dolarapi.com, CoinGecko)
 */
export async function fetchExchangeRatesFromAPI(): Promise<ExchangeRateData[]> {
  // Por ahora retornamos datos mock
  // En producción, esto debería llamar a APIs reales:
  // - Para ARS/USD: https://dolarapi.com/v1/dolares/blue
  // - Para crypto: CoinGecko API

  // MOCK: Exchange rates removed as per user request. 
  // Manual entry will be required for conversions.
  return [];
}

/**
 * Actualiza todos los tipos de cambio desde la API
 */
export async function updateExchangeRates(): Promise<void> {
  try {
    const rates = await fetchExchangeRatesFromAPI();

    for (const rate of rates) {
      await saveExchangeRate(rate.fromCurrency, rate.toCurrency, rate.rate);
    }
  } catch (error) {
    console.error('Error actualizando tipos de cambio:', error);
    throw error;
  }
}

/**
 * Convierte cualquier moneda a la moneda de visualización (ARS o USD)
 */
export async function convertToDisplayCurrency(
  amount: number,
  fromCurrency: Currency,
  displayCurrency: 'ARS' | 'USD'
): Promise<number | null> {
  const targetCurrency = displayCurrency === 'ARS' ? Currency.ARS : Currency.USD;

  // Si ya está en la moneda objetivo, retornar
  if (fromCurrency === targetCurrency) {
    return amount;
  }

  // Para crypto, primero convertir a USD y luego a la moneda objetivo si es ARS
  const cryptoCurrencies = [Currency.BTC, Currency.USDT, Currency.USDC] as const;
  if (cryptoCurrencies.includes(fromCurrency as any)) {
    // Crypto -> USD
    const amountInUsd = await convertCurrency(amount, fromCurrency, Currency.USD);

    if (amountInUsd === null) {
      return null;
    }

    // Si queremos USD, retornar
    if (displayCurrency === 'USD') {
      return amountInUsd;
    }

    // USD -> ARS
    return await convertCurrency(amountInUsd, Currency.USD, Currency.ARS);
  }

  // Conversión directa para ARS/USD
  return await convertCurrency(amount, fromCurrency, targetCurrency);
}
