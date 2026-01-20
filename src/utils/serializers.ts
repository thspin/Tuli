import { Prisma } from '@prisma/client'

/**
 * Serializa un objeto Decimal de Prisma a string para enviar al cliente.
 * Retorna null si el valor es null/undefined.
 */
export function serializeDecimal(value: Prisma.Decimal | null | undefined | number | string): number | null {
    if (value === null || value === undefined) return null;
    return Number(value.toString()); // Convertir a Number para compatibilidad con UI que espera números
}

/**
 * Helper para serializar arrays de objetos
 */
export function serializeList<T, U>(items: T[], serializer: (item: T) => U): U[] {
    return items.map(serializer);
}

// --- Serializadores Específicos ---

export function serializeTransaction(tx: any) {
    if (!tx) return null;
    return {
        ...tx,
        amount: serializeDecimal(tx.amount),
        installmentAmount: tx.installmentAmount ? serializeDecimal(tx.installmentAmount) : undefined,
        // Relaciones que pueden tener decimals
        fromProduct: tx.fromProduct ? serializeFinancialProduct(tx.fromProduct) : undefined,
        toProduct: tx.toProduct ? serializeFinancialProduct(tx.toProduct) : undefined,
        date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
        updatedAt: tx.updatedAt instanceof Date ? tx.updatedAt.toISOString() : tx.updatedAt,
    };
}

export function serializeFinancialProduct(product: any) {
    if (!product) return null;
    return {
        ...product,
        balance: serializeDecimal(product.balance),
        limit: serializeDecimal(product.limit),
        limitSinglePayment: serializeDecimal(product.limitSinglePayment),
        limitInstallments: serializeDecimal(product.limitInstallments),
        createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
        updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
        institution: product.institution ? {
            ...product.institution,
            createdAt: product.institution.createdAt instanceof Date ? product.institution.createdAt.toISOString() : product.institution.createdAt,
            updatedAt: product.institution.updatedAt instanceof Date ? product.institution.updatedAt.toISOString() : product.institution.updatedAt,
        } : undefined
    };
}

export function serializeService(service: any) {
    if (!service) return null;
    return {
        ...service,
        defaultAmount: serializeDecimal(service.defaultAmount),
        createdAt: service.createdAt instanceof Date ? service.createdAt.toISOString() : service.createdAt,
        updatedAt: service.updatedAt instanceof Date ? service.updatedAt.toISOString() : service.updatedAt,
        renewalDate: service.renewalDate instanceof Date ? service.renewalDate.toISOString() : service.renewalDate,
    };
}

export function serializeServiceBill(bill: any) {
    if (!bill) return null;
    return {
        ...bill,
        amount: serializeDecimal(bill.amount),
        dueDate: bill.dueDate instanceof Date ? bill.dueDate.toISOString() : bill.dueDate,
        createdAt: bill.createdAt instanceof Date ? bill.createdAt.toISOString() : bill.createdAt,
        updatedAt: bill.updatedAt instanceof Date ? bill.updatedAt.toISOString() : bill.updatedAt,
        service: bill.service ? serializeService(bill.service) : undefined,
        transaction: bill.transaction ? serializeTransaction(bill.transaction) : undefined,
    };
}

export function serializeSummaryAdjustment(adjustment: any) {
    if (!adjustment) return null;
    return {
        ...adjustment,
        amount: serializeDecimal(adjustment.amount),
        createdAt: adjustment.createdAt instanceof Date ? adjustment.createdAt.toISOString() : adjustment.createdAt,
    };
}

export function serializeSummaryItem(item: any) {
    if (!item) return null;
    return {
        ...item,
        amount: serializeDecimal(item.amount),
        transaction: item.transaction ? serializeTransaction(item.transaction) : undefined,
    };
}

export function serializeSummary(summary: any) {
    if (!summary) return null;
    return {
        ...summary,
        calculatedAmount: serializeDecimal(summary.calculatedAmount),
        adjustmentsAmount: serializeDecimal(summary.adjustmentsAmount),
        totalAmount: serializeDecimal(summary.totalAmount),
        closingDate: summary.closingDate instanceof Date ? summary.closingDate.toISOString() : summary.closingDate,
        dueDate: summary.dueDate instanceof Date ? summary.dueDate.toISOString() : summary.dueDate,
        paidDate: summary.paidDate instanceof Date ? summary.paidDate.toISOString() : summary.paidDate,
        createdAt: summary.createdAt instanceof Date ? summary.createdAt.toISOString() : summary.createdAt,
        updatedAt: summary.updatedAt instanceof Date ? summary.updatedAt.toISOString() : summary.updatedAt,
        product: summary.product ? serializeFinancialProduct(summary.product) : undefined,
        items: summary.items ? serializeList(summary.items, serializeSummaryItem) : undefined,
        adjustments: summary.adjustments ? serializeList(summary.adjustments, serializeSummaryAdjustment) : undefined,
    };
}
