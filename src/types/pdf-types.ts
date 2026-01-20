/**
 * Types for PDF Statement Import Feature
 */

// Supported institutions
export type InstitutionCode = 'galicia' | 'nacion' | 'naranja' | 'rioja';

// Card types
export type CardType = 'visa' | 'mastercard' | 'amex' | 'naranja';

// Adjustment types (matches Prisma enum)
export type PDFAdjustmentType = 'TAX' | 'INTEREST' | 'COMMISSION' | 'INSURANCE' | 'CREDIT' | 'OTHER';

/**
 * A single transaction parsed from the PDF
 */
export interface ParsedTransaction {
    /** Transaction date */
    date: Date;
    /** Original description from the PDF */
    description: string;
    /** Transaction amount (absolute value, always positive) */
    amount: number;
    /** Currency of the transaction */
    currency: 'ARS' | 'USD';
    /** Current installment number (e.g., 2 for "02/06") */
    installmentCurrent?: number;
    /** Total installments (e.g., 6 for "02/06") */
    installmentTotal?: number;
    /** Whether this is a Plan Z transaction (Naranja X) */
    isPlanZ: boolean;
    /** Last 4 digits of the card used */
    cardLastFour?: string;
    /** Card name (for Naranja X: "NX Virtual", "Naranja X", "NX Visa") */
    cardName?: string;
    /** Whether this is a payment (negative amount) */
    isPayment?: boolean;
    /** Coupon/receipt number from the PDF */
    couponNumber?: string;
}

/**
 * An adjustment (tax, interest, etc.) parsed from the PDF
 */
export interface ParsedAdjustment {
    /** Type of adjustment */
    type: PDFAdjustmentType;
    /** Description of the adjustment */
    description: string;
    /** Amount (positive for charges, negative for credits) */
    amount: number;
    /** Currency */
    currency: 'ARS' | 'USD';
    /** Card name (for Naranja X: "NX Virtual", "Naranja X", "NX Visa") */
    cardName?: string;
}

/**
 * Complete parsed statement data
 */
export interface ParsedStatement {
    /** Detected institution */
    institution: InstitutionCode;
    /** Detected card type */
    cardType: CardType;
    /** Card provider (VISA, MASTERCARD, AMEX) if detected */
    cardProvider?: 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER';
    /** Last 4 digits of the main card */
    cardLastFour?: string;

    // Current period dates
    /** Closing date for the current period */
    closingDate: Date;
    /** Due date for the current period */
    dueDate: Date;
    /** Month of the statement (1-12) */
    statementMonth: number;
    /** Year of the statement */
    statementYear: number;

    // Previous period dates (for verification)
    /** Previous closing date */
    previousClosingDate?: Date;
    /** Previous due date */
    previousDueDate?: Date;

    // Next period dates (detected from statement)
    /** Next closing date */
    nextClosingDate?: Date;
    /** Next due date */
    nextDueDate?: Date;

    // Balances
    /** Previous balance (saldo anterior) */
    previousBalance: number;
    /** Previous balance in USD if applicable */
    previousBalanceUSD?: number;
    /** Payment made in the period */
    paymentMade: number;
    /** Payment made in USD if applicable */
    paymentMadeUSD?: number;
    /** Total amount due (saldo actual) */
    totalAmount: number;
    /** Total amount in USD if applicable */
    totalAmountUSD?: number;
    /** Minimum payment */
    minimumPayment?: number;

    /** List of transactions */
    transactions: ParsedTransaction[];
    /** List of adjustments */
    adjustments: ParsedAdjustment[];

    // For Naranja X: track per-card totals
    /** Card breakdown (for multi-card statements like Naranja X) */
    cardBreakdown?: Array<{
        cardName: string;
        totalARS: number;
        totalUSD: number;
        transactionCount: number;
    }>;

    /** Raw text for debugging */
    rawText?: string;
}

/**
 * Match types for reconciliation
 */
export type MatchType = 'exact' | 'partial' | 'not_found' | 'discrepancy' | 'already_reconciled';

/**
 * A single item in the reconciliation process
 */
export interface ReconciliationItem {
    /** Transaction from the PDF */
    pdfTransaction: ParsedTransaction;
    /** Matched transaction from the database (if found) */
    matchedTransactionId?: string;
    /** Matched transaction details */
    matchedTransaction?: {
        id: string;
        date: Date;
        description: string;
        amount: number;
        categoryId?: string;
    };
    /** Type of match */
    matchType: MatchType;
    /** Confidence score (0-100) */
    confidence: number;
    /** Reason for the match type */
    reason?: string;
    /** Whether the user has confirmed this match */
    userConfirmed?: boolean;
    /** User's decision: accept, reject, or create new */
    userAction?: 'accept' | 'reject' | 'create_new';
}

/**
 * Adjustment reconciliation item
 */
export interface AdjustmentReconciliationItem {
    /** Adjustment from the PDF */
    pdfAdjustment: ParsedAdjustment;
    /** Existing adjustment in the database (if found) */
    existingAdjustmentId?: string;
    /** Whether this already exists */
    alreadyExists: boolean;
    /** Whether to create/update this adjustment */
    shouldApply: boolean;
}

/**
 * Complete reconciliation result
 */
export interface ReconciliationResult {
    /** The parsed statement */
    statement: ParsedStatement;
    /** The product ID being reconciled */
    productId: string;
    /** The summary ID (existing or to be created) */
    summaryId?: string;
    /** Whether a new summary needs to be created */
    needsNewSummary: boolean;
    /** Transaction reconciliation items */
    transactions: ReconciliationItem[];
    /** Adjustment reconciliation items */
    adjustments: AdjustmentReconciliationItem[];
    /** Summary of changes */
    summary: {
        exactMatches: number;
        partialMatches: number;
        notFound: number;
        discrepancies: number;
        totalPDFTransactions: number;
        totalDBTransactions: number;
        amountDifference: number;
    };
    /** Dates to update */
    datesToUpdate?: {
        closingDate: Date;
        dueDate: Date;
        previousClosingDate?: Date;
        previousDueDate?: Date;
    };
}

/**
 * Result of applying the import
 */
export interface ImportResult {
    success: boolean;
    message: string;
    summaryId?: string;
    createdTransactions: number;
    updatedTransactions: number;
    createdAdjustments: number;
    errors?: string[];
}
