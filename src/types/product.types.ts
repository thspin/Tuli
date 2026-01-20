// src/types/product.types.ts
import { ProductType, Currency } from '@prisma/client';

export interface Product {
    id: string;
    name: string;
    type: ProductType;
    currency: Currency;
    balance: number;
    closingDay?: number | null;
    dueDay?: number | null;
    limit?: number | null; // Deprecated
    limitSinglePayment?: number | null;
    limitInstallments?: number | null;
    sharedLimit?: boolean;
    unifiedLimit?: boolean;
    institutionId?: string | null;
    linkedProductId?: string | null;
    lastFourDigits?: string | null;
    provider?: CardProvider | null;
    expirationDate?: Date | string | null;
}

export type CardProvider = 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER';

export const CARD_PROVIDER_LOGOS: Record<CardProvider, string> = {
    VISA: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
    MASTERCARD: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
    AMEX: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg',
    OTHER: '',
};

export const CARD_PROVIDER_LABELS: Record<CardProvider, string> = {
    VISA: 'Visa',
    MASTERCARD: 'Mastercard',
    AMEX: 'American Express',
    OTHER: 'Otro',
};

export interface ProductWithInstitution extends Product {
    institution?: Institution | null;
}

export interface Institution {
    id: string;
    name: string;
    type: 'BANK' | 'WALLET';
    shareSummary?: boolean;
}

export interface InstitutionWithProducts extends Institution {
    products: Product[];
}

export const PRODUCT_TYPE_ICONS: Record<ProductType, string> = {
    CASH: '💵',
    SAVINGS_ACCOUNT: '🏦',
    CHECKING_ACCOUNT: '📋',
    DEBIT_CARD: '💳',
    CREDIT_CARD: '💳',
    LOAN: '📊',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    CASH: 'Efectivo',
    SAVINGS_ACCOUNT: 'Caja de Ahorro',
    CHECKING_ACCOUNT: 'Cuenta Corriente',
    DEBIT_CARD: 'Tarjeta de Débito',
    CREDIT_CARD: 'Tarjeta de Crédito',
    LOAN: 'Préstamo',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
    ARS: 'Peso Argentino (ARS)',
    USD: 'Dólar (USD)',
    USDT: 'Tether (USDT)',
    USDC: 'USD Coin (USDC)',
    BTC: 'Bitcoin (BTC)',
};
