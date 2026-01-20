// src/types/index.ts
/**
 * Barrel file para exportar todos los tipos
 * Permite importar múltiples tipos desde un solo lugar
 * Ejemplo: import { Product, Category, Transaction } from '@/src/types';
 */

// Product types
export { ProductType, Currency } from '@prisma/client';

export type {
    Product,
    ProductWithInstitution,
    Institution,
    InstitutionWithProducts,
} from './product.types';

export {
    PRODUCT_TYPE_ICONS,
    PRODUCT_TYPE_LABELS,
    CURRENCY_LABELS,
    CARD_PROVIDER_LABELS,
    CARD_PROVIDER_LOGOS,
} from './product.types';

export type { CardProvider } from './product.types';

// Category types
export type {
    Category,
    CategoryFormData,
} from './category.types';

export { COMMON_CATEGORY_EMOJIS } from './category.types';

// Transaction types
export type {
    Transaction,
    TransactionWithDetails,
    TransactionFormData,
    IncomeFormData,
} from './transaction.types';

// Summary types
export type {
    Summary,
    SummaryDetail,
    PaymentAccount,
    PaymentReceipt,
} from './summary.types';

export { MONTH_NAMES } from './summary.types';

// PDF Import types
export type {
    InstitutionCode,
    CardType,
    PDFAdjustmentType,
    ParsedTransaction,
    ParsedAdjustment,
    ParsedStatement,
    MatchType,
    ReconciliationItem,
    AdjustmentReconciliationItem,
    ReconciliationResult,
    ImportResult,
} from './pdf-types';

// Common types
export type DisplayCurrency = 'ARS' | 'USD';

export interface ActionResult<T = void> {
    success: boolean;
    error?: string;
    data?: T;
}
