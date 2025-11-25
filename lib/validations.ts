// lib/validations.ts
import { ProductType, InstitutionType, Currency } from '@prisma/client';

/**
 * Validaciones de productos financieros según su tipo
 */

// Tipos de productos permitidos por institución
export const ALLOWED_PRODUCTS_BY_INSTITUTION: Record<InstitutionType, ProductType[]> = {
  BANK: [
    ProductType.SAVINGS_ACCOUNT,
    ProductType.CHECKING_ACCOUNT,
    ProductType.DEBIT_CARD,
    ProductType.CREDIT_CARD,
    ProductType.LOAN,
  ],
  WALLET: [
    ProductType.SAVINGS_ACCOUNT, // Cuenta única de billetera
    ProductType.DEBIT_CARD,
    ProductType.CREDIT_CARD,
    ProductType.LOAN,
  ],
};

// Monedas permitidas por tipo de institución
export const ALLOWED_CURRENCIES_BY_INSTITUTION: Record<InstitutionType, Currency[]> = {
  BANK: [Currency.ARS, Currency.USD],
  WALLET: [Currency.ARS, Currency.USD, Currency.BTC, Currency.USDT, Currency.USDC],
};

// Monedas permitidas para efectivo
export const ALLOWED_CURRENCIES_CASH: Currency[] = [Currency.ARS, Currency.USD];

/**
 * Valida si un tipo de producto es permitido para una institución
 */
export function isProductTypeAllowedForInstitution(
  productType: ProductType,
  institutionType: InstitutionType
): boolean {
  return ALLOWED_PRODUCTS_BY_INSTITUTION[institutionType].includes(productType);
}

/**
 * Valida si una moneda es permitida para una institución
 */
export function isCurrencyAllowedForInstitution(
  currency: Currency,
  institutionType: InstitutionType
): boolean {
  return ALLOWED_CURRENCIES_BY_INSTITUTION[institutionType].includes(currency);
}

/**
 * Valida si una moneda es permitida para efectivo
 */
export function isCurrencyAllowedForCash(currency: Currency): boolean {
  return ALLOWED_CURRENCIES_CASH.includes(currency);
}

/**
 * Valida restricciones de saldo según tipo de producto e institución
 */
export function validateBalance(
  balance: number,
  productType: ProductType,
  institutionType?: InstitutionType
): { valid: boolean; error?: string } {
  // CASH: solo positivo o cero
  if (productType === ProductType.CASH) {
    if (balance < 0) {
      return { valid: false, error: 'El efectivo no puede tener saldo negativo' };
    }
    return { valid: true };
  }

  // CREDIT_CARD: solo cero o negativo (deuda)
  if (productType === ProductType.CREDIT_CARD) {
    if (balance > 0) {
      return { valid: false, error: 'Las tarjetas de crédito no pueden tener saldo positivo' };
    }
    return { valid: true };
  }

  // LOAN: solo cero o negativo (deuda)
  if (productType === ProductType.LOAN) {
    if (balance > 0) {
      return { valid: false, error: 'Los préstamos no pueden tener saldo positivo' };
    }
    return { valid: true };
  }

  // SAVINGS_ACCOUNT y CHECKING_ACCOUNT dependen de la institución
  if (productType === ProductType.SAVINGS_ACCOUNT || productType === ProductType.CHECKING_ACCOUNT) {
    if (institutionType === InstitutionType.WALLET) {
      // Billeteras: solo positivo o cero
      if (balance < 0) {
        return { valid: false, error: 'Las cuentas de billeteras virtuales no pueden tener saldo negativo' };
      }
    }
    // Bancos: cualquier saldo (permite descubierto)
    return { valid: true };
  }

  // DEBIT_CARD: solo positivo o cero
  if (productType === ProductType.DEBIT_CARD) {
    if (balance < 0) {
      return { valid: false, error: 'Las tarjetas de débito no pueden tener saldo negativo' };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Valida campos requeridos para tarjetas de crédito
 */
export function validateCreditCardFields(
  closingDay?: number | null,
  dueDay?: number | null,
  limit?: number | null
): { valid: boolean; error?: string } {
  if (closingDay === null || closingDay === undefined) {
    return { valid: false, error: 'El día de cierre es requerido para tarjetas de crédito' };
  }

  if (dueDay === null || dueDay === undefined) {
    return { valid: false, error: 'El día de vencimiento es requerido para tarjetas de crédito' };
  }

  if (limit === null || limit === undefined) {
    return { valid: false, error: 'El límite de crédito es requerido' };
  }

  if (closingDay < 1 || closingDay > 31) {
    return { valid: false, error: 'El día de cierre debe estar entre 1 y 31' };
  }

  if (dueDay < 1 || dueDay > 31) {
    return { valid: false, error: 'El día de vencimiento debe estar entre 1 y 31' };
  }

  // Se permite que el día de cierre sea mayor al de vencimiento (vencimiento en el próximo mes)
  if (closingDay === dueDay) {
    return { valid: false, error: 'El día de cierre no puede ser igual al día de vencimiento' };
  }

  if (limit <= 0) {
    return { valid: false, error: 'El límite de crédito debe ser mayor a cero' };
  }

  return { valid: true };
}

/**
 * Valida campos requeridos para préstamos
 */
export function validateLoanFields(
  limit?: number | null
): { valid: boolean; error?: string } {
  if (limit === null || limit === undefined) {
    return { valid: false, error: 'El límite disponible es requerido para préstamos' };
  }

  if (limit <= 0) {
    return { valid: false, error: 'El límite disponible debe ser mayor a cero' };
  }

  return { valid: true };
}

/**
 * Valida que un producto no requiera institución (solo CASH)
 */
export function requiresInstitution(productType: ProductType): boolean {
  return productType !== ProductType.CASH;
}

/**
 * Obtiene el nombre legible del tipo de producto
 */
export function getProductTypeLabel(type: ProductType): string {
  const labels: Record<ProductType, string> = {
    CASH: 'Efectivo',
    SAVINGS_ACCOUNT: 'Caja de Ahorro',
    CHECKING_ACCOUNT: 'Cuenta Corriente',
    DEBIT_CARD: 'Tarjeta de Débito',
    CREDIT_CARD: 'Tarjeta de Crédito',
    LOAN: 'Préstamo',
  };
  return labels[type];
}

/**
 * Obtiene el nombre legible del tipo de institución
 */
export function getInstitutionTypeLabel(type: InstitutionType): string {
  const labels: Record<InstitutionType, string> = {
    BANK: 'Banco',
    WALLET: 'Billetera Virtual',
  };
  return labels[type];
}

/**
 * Obtiene el símbolo de la moneda
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    ARS: '$',
    USD: 'US$',
    USDT: 'USDT',
    USDC: 'USDC',
    BTC: '₿',
  };
  return symbols[currency];
}

/**
 * Formatea un número para display (sin símbolo de moneda)
 * Usa un formato consistente para evitar problemas de hidratación
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  // Formato manual para evitar problemas de hidratación
  const fixed = amount.toFixed(decimals);
  const parts = fixed.split('.');

  // Agregar separadores de miles
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return parts.join(',');
}

/**
 * Formatea un monto con su símbolo de moneda
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  const decimals = currency === Currency.BTC ? 8 : 2;
  const formatted = formatNumber(amount, decimals);
  return `${symbol} ${formatted}`;
}
