'use server'

import { v4 as uuidv4 } from 'uuid';

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { TransactionType, SummaryStatus, AdjustmentType } from "@prisma/client";
import { serializeSummary } from "@/src/utils/serializers";

const BA_TZ = 'America/Argentina/Buenos_Aires';

// Helper to get BA month/year for any date (returns 1-12 for month)
const getBAInfo = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BA_TZ,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).formatToParts(date);
    return {
        y: parseInt(parts.find(p => p.type === 'year')!.value),
        m: parseInt(parts.find(p => p.type === 'month')!.value),
        d: parseInt(parts.find(p => p.type === 'day')!.value)
    };
};

// Calculate closing and due dates based on product settings
function calculateSummaryDates(year: number, month: number, closingDay: number, dueDay: number) {
    // Closing date is in the current month
    const closingDate = new Date(year, month - 1, closingDay, 23, 59, 59);

    // Due date is typically in the next month (or same month if dueDay > closingDay)
    let dueMonth = month;
    let dueYear = year;

    if (dueDay <= closingDay) {
        // Due date is in the next month
        dueMonth = month + 1;
        if (dueMonth > 12) {
            dueMonth = 1;
            dueYear = year + 1;
        }
    }

    const dueDate = new Date(dueYear, dueMonth - 1, dueDay, 23, 59, 59);

    return { closingDate, dueDate };
}

// Determine which summary month a transaction belongs to based on closing dates
function getTransactionSummaryMonth(txDate: Date, closingDay: number): { year: number; month: number } {
    const { y, m, d } = getBAInfo(txDate);

    // If the transaction date is after the closing day, it goes to the next month's summary
    if (d > closingDay) {
        let nextMonth = m + 1;
        let nextYear = y;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear = y + 1;
        }
        return { year: nextYear, month: nextMonth };
    }

    // Otherwise, it belongs to the current month's summary
    return { year: y, month: m };
}

/**
 * Generate or get summary for a specific month/year. Creates it if it doesn't exist.
 */
export async function generateSummary(productId: string, year: number, month: number) {
    try {
        const user = await requireUser();

        // Get the product (must be credit card)
        const product = await prisma.financialProduct.findUnique({
            where: { id: productId, userId: user.id },
        });

        if (!product || product.type !== 'CREDIT_CARD') {
            throw new Error('Producto no encontrado o no es una tarjeta de crédito');
        }

        const closingDay = product.closingDay || 15;
        const dueDay = product.dueDay || 5;

        const { closingDate, dueDate } = calculateSummaryDates(year, month, closingDay, dueDay);

        // Get or create summary
        let summary = await prisma.creditCardSummary.findFirst({
            where: {
                productId,
                year,
                month
            },
            include: {
                items: { include: { transaction: true } },
                adjustments: true
            }
        });

        if (!summary) {
            // Create new summary
            summary = await prisma.creditCardSummary.create({
                data: {
                    productId,
                    year,
                    month,
                    closingDate,
                    dueDate,
                    status: SummaryStatus.DRAFT,
                    userId: user.id,
                },
                include: {
                    items: { include: { transaction: true } },
                    adjustments: true
                }
            });
        }

        // If CLOSED or PAID, do NOT recalculate. Return as matches the "approved" snapshot.
        if (summary.status === SummaryStatus.PAID || summary.status === SummaryStatus.CLOSED) {
            // Just return what we have
        }
        // If not closed, recalculate items from transactions (Draft mode)
        else {
            // Find all expense transactions from this card that belong to this summary period
            // ... (rest of the logic remains, but we wrap it in else)

            // Previous closing date
            let prevMonth = month - 1;
            let prevYear = year;
            if (prevMonth < 1) {
                prevMonth = 12;
                prevYear = year - 1;
            }
            const prevClosingDate = new Date(prevYear, prevMonth - 1, closingDay, 23, 59, 59);

            // Extend search to due date + 5 days to catch transactions dated in the payment month
            // (Consistency with import logic)
            const searchEndDate = new Date(summary.dueDate.getTime() + 5 * 24 * 60 * 60 * 1000);

            // Get transactions made with this card in the period
            // IMPORTANT: Transactions with date AFTER the closing day belong to the NEXT month's summary
            // For January summary with closing day 29:
            //   - Jan 1-29 → belongs to January summary
            //   - Jan 30-31 → belongs to February summary
            const monthStart = new Date(year, month - 1, 1, 0, 0, 0);
            // Only include transactions UP TO the closing day of this month
            const closingCutoff = new Date(year, month - 1, closingDay, 23, 59, 59);

            const transactions = await prisma.transaction.findMany({
                where: {
                    fromProductId: productId,
                    type: TransactionType.EXPENSE,
                    userId: user.id,
                    OR: [
                        // Standard period-based logic: from previous closing to this closing
                        {
                            date: {
                                gt: prevClosingDate,
                                lte: closingDate
                            }
                        },
                        // Also include transactions from the start of the month up to closing day
                        // This catches any transactions that might have been missed by the above
                        {
                            date: {
                                gte: monthStart,
                                lte: closingCutoff
                            }
                        }
                    ]
                }
            });

            // Also include installment transactions explicitly set for this month/year or by date range
            const installmentTxs = await prisma.transaction.findMany({
                where: {
                    fromProductId: productId,
                    type: TransactionType.EXPENSE,
                    installmentId: { not: null },
                    userId: user.id,
                    OR: [
                        // Option 1: Date falls within the closing period (previous closing to this closing)
                        {
                            date: {
                                gt: prevClosingDate,
                                lte: closingDate
                            }
                        },
                        // Option 2: Date is from the start of the month up to the closing day
                        // This catches installments that might have been created with dates
                        // at the beginning of the month but before the closing day
                        {
                            date: {
                                gte: monthStart,
                                lte: closingCutoff
                            }
                        }
                    ]
                }
            });

            // Let's rely on date range mostly, but ensure our range covers the "future installment" dates.
            // If we created a future installment for "01 Jan 2026", it should be picked up by Jan summary.
            // The `searchEndDate` is due_date + 5 days. For Jan summary, due date is ~Feb 10. So it covers Jan 1st.
            // However, let's be safe and check if the transaction date YEAR/MONTH matches the summary YEAR/MONTH directly?
            // Prisma doesn't support easy month/year extraction in where clause without raw query.
            // But since we control the dates of future installments (we set them to X date), we just need to ensure our range `prevClosingDate` -> `searchEndDate` is correct.
            // If previous closing was Dec 28, and this closing is Jan 29. The range is Dec 29 -> Feb 20 (approx).
            // A future installment for Jan 04 will be found.
            // A future installment for Feb 04 (belongs to Feb summary?)
            // If closing is Jan 29, Feb 04 belongs to NEXT summary (Feb).
            // So the range logic IS correct, assuming the future installments have the correct dates.

            // BUT: If the user manually edited dates, we might miss them?
            // Let's add a check: if the transaction date is roughly in this month.


            // Combine and dedupe
            const allTxIds = new Set<string>();
            const allTransactions = [...transactions, ...installmentTxs].filter(t => {
                if (allTxIds.has(t.id)) return false;
                allTxIds.add(t.id);
                return true;
            });

            // Optimize: Bulk operations instead of individual upserts
            const existingItems = await prisma.summaryItem.findMany({
                where: { summaryId: summary.id },
                select: { transactionId: true, amount: true }
            });
            const existingMap = new Map(existingItems.map(i => [i.transactionId, Number(i.amount)]));
            const activeTxIds = new Set<string>();
            const txsToAdd: any[] = [];
            const txsToUpdate: any[] = [];

            for (const tx of allTransactions) {
                activeTxIds.add(tx.id);
                if (!existingMap.has(tx.id)) {
                    txsToAdd.push({
                        summaryId: summary!.id,
                        transactionId: tx.id,
                        amount: tx.amount,
                        isReconciled: false,
                        hasDiscrepancy: false
                    });
                } else {
                    const currentAmount = existingMap.get(tx.id);
                    if (currentAmount !== Number(tx.amount)) {
                        txsToUpdate.push(tx);
                    }
                }
            }

            const txIdsToRemove = existingItems
                .filter(i => !activeTxIds.has(i.transactionId))
                .map(i => i.transactionId);

            if (txsToAdd.length > 0 || txIdsToRemove.length > 0 || txsToUpdate.length > 0) {
                await prisma.$transaction(async (tx) => {
                    if (txsToAdd.length > 0) {
                        await tx.summaryItem.createMany({ data: txsToAdd });
                    }
                    if (txIdsToRemove.length > 0) {
                        await tx.summaryItem.deleteMany({
                            where: {
                                summaryId: summary!.id,
                                transactionId: { in: txIdsToRemove }
                            }
                        });
                    }
                    for (const t of txsToUpdate) {
                        await tx.summaryItem.update({
                            where: {
                                summaryId_transactionId: {
                                    summaryId: summary!.id,
                                    transactionId: t.id
                                }
                            },
                            data: { amount: t.amount }
                        });
                    }
                });
            }

            // Calculate totals (memory calculation is faster than DB aggregate after changes)
            // We use allTransactions because that represents the current truth
            const calculatedAmount = allTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

            // Get adjustments total
            const adjustments = await prisma.summaryAdjustment.findMany({
                where: { summaryId: summary.id }
            });
            const adjustmentsAmount = adjustments.reduce((sum, adj) => {
                const amt = Number(adj.amount);
                return sum + amt;
            }, 0);

            // Update summary amounts if changed
            if (Number(summary.calculatedAmount) !== calculatedAmount ||
                Number(summary.adjustmentsAmount) !== adjustmentsAmount ||
                Number(summary.totalAmount) !== (calculatedAmount + adjustmentsAmount)) {

                await prisma.creditCardSummary.update({
                    where: { id: summary.id },
                    data: {
                        calculatedAmount,
                        adjustmentsAmount,
                        totalAmount: calculatedAmount + adjustmentsAmount
                    }
                });
            }

            // Refetch with updated data
            summary = await prisma.creditCardSummary.findUnique({
                where: { id: summary.id },
                include: {
                    items: {
                        include: {
                            transaction: {
                                include: { category: true }
                            }
                        },
                        orderBy: { transaction: { date: 'desc' } }
                    },
                    adjustments: { orderBy: { createdAt: 'desc' } }
                }
            });
        }

        revalidatePath('/accounts');
        return { success: true, summary: serializeSummary(summary) };

    } catch (error) {
        console.error('Error generating summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Get all summaries for a credit card
 */
export async function getSummaries(productId: string, options?: { status?: SummaryStatus }) {
    try {
        const user = await requireUser();

        const where: any = {
            productId,
            userId: user.id
        };

        if (options?.status) {
            where.status = options.status;
        }

        const summaries = await prisma.creditCardSummary.findMany({
            where,
            include: {
                items: true,
                adjustments: true
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });

        return { success: true, summaries: summaries.map(serializeSummary) };

    } catch (error) {
        console.error('Error getting summaries:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            summaries: []
        };
    }
}

/**
 * Get detailed summary with all items and adjustments
 */
export async function getSummaryDetails(summaryId: string) {
    try {
        const user = await requireUser();

        const summary = await prisma.creditCardSummary.findUnique({
            where: { id: summaryId },
            include: {
                product: {
                    include: { institution: true }
                },
                items: {
                    include: {
                        transaction: {
                            include: { category: true }
                        }
                    },
                    orderBy: { transaction: { date: 'desc' } }
                },
                adjustments: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!summary || summary.userId !== user.id) {
            throw new Error('Resumen no encontrado');
        }

        return { success: true, summary: serializeSummary(summary) };

    } catch (error) {
        console.error('Error getting summary details:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Add adjustment (commission, tax, etc.) to a summary
 */
export async function addSummaryAdjustment(summaryId: string, data: {
    type: AdjustmentType;
    description: string;
    amount: number;
}) {
    try {
        const user = await requireUser();

        const summary = await prisma.creditCardSummary.findUnique({
            where: { id: summaryId }
        });

        if (!summary || summary.userId !== user.id) {
            throw new Error('Resumen no encontrado');
        }

        if (summary.status === SummaryStatus.PAID) {
            throw new Error('No se puede modificar un resumen pagado');
        }

        await prisma.$transaction(async (tx) => {
            const isCredit = (data.type as string) === 'CREDIT';
            const finalAmount = isCredit ? -Math.abs(data.amount) : Math.abs(data.amount);

            // Create adjustment
            await tx.summaryAdjustment.create({
                data: {
                    summaryId,
                    type: data.type as any,
                    description: data.description,
                    amount: finalAmount
                }
            });

            // Update summary totals
            const newAdjustmentsAmount = Number(summary.adjustmentsAmount) + finalAmount;
            const newTotalAmount = Number(summary.calculatedAmount) + newAdjustmentsAmount;

            await tx.creditCardSummary.update({
                where: { id: summaryId },
                data: {
                    adjustmentsAmount: newAdjustmentsAmount,
                    totalAmount: newTotalAmount
                }
            });
        });

        revalidatePath('/accounts');
        return { success: true };

    } catch (error) {
        console.error('Error adding adjustment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Delete an adjustment
 */
export async function deleteSummaryAdjustment(adjustmentId: string) {
    try {
        const user = await requireUser();

        const adjustment = await prisma.summaryAdjustment.findUnique({
            where: { id: adjustmentId },
            include: { summary: true }
        });

        if (!adjustment || adjustment.summary.userId !== user.id) {
            throw new Error('Ajuste no encontrado');
        }

        if (adjustment.summary.status === SummaryStatus.PAID) {
            throw new Error('No se puede modificar un resumen pagado');
        }

        await prisma.$transaction(async (tx) => {
            await tx.summaryAdjustment.delete({
                where: { id: adjustmentId }
            });

            // Update summary totals
            const newAdjustmentsAmount = Number(adjustment.summary.adjustmentsAmount) - Number(adjustment.amount);
            const newTotalAmount = Number(adjustment.summary.calculatedAmount) + newAdjustmentsAmount;

            await tx.creditCardSummary.update({
                where: { id: adjustment.summaryId },
                data: {
                    adjustmentsAmount: newAdjustmentsAmount,
                    totalAmount: newTotalAmount
                }
            });
        });

        revalidatePath('/accounts');
        revalidatePath('/calendar');
        revalidatePath('/');
        return { success: true };

    } catch (error) {
        console.error('Error deleting adjustment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Close summary (mark as definitive, ready for payment)
 */
export async function closeSummary(summaryId: string, finalTotal?: number) {
    try {
        const user = await requireUser();

        const summary = await prisma.creditCardSummary.findUnique({
            where: { id: summaryId }
        });

        if (!summary || summary.userId !== user.id) {
            throw new Error('Resumen no encontrado');
        }

        if (summary.status !== SummaryStatus.DRAFT) {
            throw new Error('El resumen ya está cerrado');
        }

        await prisma.creditCardSummary.update({
            where: { id: summaryId },
            data: {
                status: SummaryStatus.CLOSED,
                isClosed: true,
                totalAmount: finalTotal ?? summary.totalAmount
            }
        });

        revalidatePath('/accounts');
        return { success: true };

    } catch (error) {
        console.error('Error closing summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Pay summary - the main action that creates the real expense
 */
export async function paySummary(summaryId: string, fromProductId: string, paymentDate?: Date) {
    try {
        const user = await requireUser();

        const summary = await prisma.creditCardSummary.findUnique({
            where: { id: summaryId },
            include: {
                product: true,
                items: { include: { transaction: true } },
                adjustments: true
            }
        });

        if (!summary || summary.userId !== user.id) {
            throw new Error('Resumen no encontrado');
        }

        if (summary.status === SummaryStatus.PAID) {
            throw new Error('El resumen ya está pagado');
        }

        // Get source account
        const fromProduct = await prisma.financialProduct.findUnique({
            where: { id: fromProductId, userId: user.id }
        });

        if (!fromProduct) {
            throw new Error('Cuenta de origen no encontrada');
        }

        // Validate it's a liquidity product (not credit card or loan)
        if (fromProduct.type === 'CREDIT_CARD' || fromProduct.type === 'LOAN') {
            throw new Error('No se puede pagar desde una tarjeta de crédito o préstamo');
        }

        const date = paymentDate || new Date();

        await prisma.$transaction(async (tx) => {
            // --- PLAN Z PROCESSING ---
            // @ts-ignore
            const planZItems = summary.items.filter(item => item.transaction.planZ);
            let adjustmentsForPlanZ = 0;

            for (const item of planZItems) {
                const originalTx = item.transaction;
                const installmentAmount = Number(originalTx.amount) / 3;
                const installmentId = uuidv4();

                // Create 3 installments
                for (let i = 0; i < 3; i++) {
                    const txDate = new Date(originalTx.date);
                    txDate.setMonth(txDate.getMonth() + i);

                    const newTx = await tx.transaction.create({
                        data: {
                            amount: installmentAmount,
                            date: txDate,
                            description: `${originalTx.description} (Plan Z ${i + 1}/3)`,
                            type: TransactionType.EXPENSE,
                            fromProductId: originalTx.fromProductId,
                            categoryId: originalTx.categoryId,
                            userId: user.id,
                            installmentNumber: i + 1,
                            installmentTotal: 3,
                            installmentId: installmentId,
                            // @ts-ignore
                            planZ: false, // Don't process this again
                        }
                    });

                    // If it's the first installment, add it to THIS summary
                    if (i === 0) {
                        await tx.summaryItem.create({
                            data: {
                                summaryId: summary.id,
                                transactionId: newTx.id,
                                amount: installmentAmount,
                                isReconciled: false
                            }
                        });
                    }
                }

                // Delete original transaction (This will Cascade Delete the original SummaryItem)
                await tx.transaction.delete({ where: { id: originalTx.id } });

                // Calculate adjustment: We remove full amount and add 1/3 amount
                // Net change to summary = (1/3 - 1) * amount = -2/3 amount
                adjustmentsForPlanZ += (Number(originalTx.amount) - installmentAmount);
            }

            // Recalculate totals
            const currentTotal = Number(summary.totalAmount);
            const amountToPay = currentTotal - adjustmentsForPlanZ;
            const newCalculatedAmount = Number(summary.calculatedAmount) - adjustmentsForPlanZ;

            // Update Summary with new totals before paying
            await tx.creditCardSummary.update({
                where: { id: summaryId },
                data: {
                    calculatedAmount: newCalculatedAmount,
                    totalAmount: amountToPay
                }
            });

            // Validate sufficient balance for the NEW amount
            if (Number(fromProduct.balance) < amountToPay) {
                throw new Error(`Saldo insuficiente. Disponible: $${Number(fromProduct.balance).toFixed(2)}, Necesario: $${amountToPay.toFixed(2)}`);
            }

            // 1. Create TRANSFER transaction (from liquidity to credit card)
            const paymentTx = await tx.transaction.create({
                data: {
                    amount: amountToPay,
                    date,
                    description: `Pago Resumen ${summary.product.name} ${summary.month}/${summary.year}`,
                    type: TransactionType.TRANSFER,
                    fromProductId,
                    toProductId: summary.productId,
                    userId: user.id,
                    status: 'COMPLETED'
                }
            });

            // 2. Debit from source account
            await tx.financialProduct.update({
                where: { id: fromProductId },
                data: {
                    balance: { decrement: amountToPay }
                }
            });

            // 3. Credit to credit card (reduce debt)
            await tx.financialProduct.update({
                where: { id: summary.productId },
                data: {
                    balance: { increment: amountToPay }
                }
            });

            // 3b. Create EXPENSE transactions for Adjustments (Taxes, Interests, etc)
            // These expenses are paid now, so we record them to have proper categorization
            for (const adj of summary.adjustments) {
                // Skip negative adjustments (CREDITS) as they reduce the payment, they are not expenses.
                // Actually CREDITS should probably be INCOME? Or reverse expense?
                // For now handling typical costs (positive amounts).
                if (Number(adj.amount) > 0) {
                    await tx.transaction.create({
                        data: {
                            amount: Number(adj.amount),
                            date,
                            description: `${adj.description} (Resumen ${summary.month}/${summary.year})`,
                            type: TransactionType.EXPENSE,
                            fromProductId, // Paid from the source account
                            userId: user.id,
                            status: 'COMPLETED',
                            // Ideally we would map adj.type to a categoryId if we had a map
                        }
                    });
                }
            }

            // 4. Mark summary as paid
            await tx.creditCardSummary.update({
                where: { id: summaryId },
                data: {
                    status: SummaryStatus.PAID,
                    isClosed: true,
                    paidDate: date,
                    paidFromProductId: fromProductId,
                    paymentTransactionId: paymentTx.id
                }
            });
        });

        revalidatePath('/accounts');
        revalidatePath('/transactions');
        revalidatePath('/calendar');
        revalidatePath('/');

        return { success: true };

    } catch (error) {
        console.error('Error paying summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Update item reconciliation status
 */
export async function updateSummaryItem(itemId: string, data: {
    isReconciled?: boolean;
    hasDiscrepancy?: boolean;
    note?: string;
}) {
    try {
        const user = await requireUser();

        const item = await prisma.summaryItem.findUnique({
            where: { id: itemId },
            include: { summary: true }
        });

        if (!item || item.summary.userId !== user.id) {
            throw new Error('Item no encontrado');
        }

        if (item.summary.status === SummaryStatus.PAID) {
            throw new Error('No se puede modificar un resumen pagado');
        }

        await prisma.summaryItem.update({
            where: { id: itemId },
            data: {
                isReconciled: data.isReconciled,
                hasDiscrepancy: data.hasDiscrepancy,
                note: data.note
            }
        });

        revalidatePath('/accounts');
        return { success: true };

    } catch (error) {
        console.error('Error updating summary item:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Update summary dates (Closing and Due dates)
 */
export async function updateSummaryDates(summaryId: string, closingDate: Date | string, dueDate: Date | string) {
    try {
        const user = await requireUser();

        const summary = await prisma.creditCardSummary.findUnique({
            where: { id: summaryId }
        });

        if (!summary || summary.userId !== user.id) {
            throw new Error('Resumen no encontrado');
        }

        if (summary.status === SummaryStatus.PAID) {
            throw new Error('No se puede modificar un resumen pagado');
        }

        await prisma.creditCardSummary.update({
            where: { id: summaryId },
            data: {
                closingDate: new Date(`${closingDate}T12:00:00`),
                dueDate: new Date(`${dueDate}T12:00:00`)
            }
        });

        revalidatePath('/accounts');
        revalidatePath('/calendar');
        return { success: true };

    } catch (error) {
        console.error('Error updating summary dates:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Get projected summaries for upcoming months (based on future installments)
 */
export async function getProjectedSummaries(productId: string, monthsAhead: number = 12) {
    try {
        const user = await requireUser();

        const product = await prisma.financialProduct.findUnique({
            where: { id: productId, userId: user.id }
        });

        if (!product || product.type !== 'CREDIT_CARD') {
            throw new Error('Producto no encontrado o no es una tarjeta de crédito');
        }

        const closingDay = product.closingDay || 15;
        const dueDay = product.dueDay || 5;

        const now = new Date();
        const { y: currentYear, m: currentMonth } = getBAInfo(now);

        // Get all future installment transactions
        const futureTransactions = await prisma.transaction.findMany({
            where: {
                fromProductId: productId,
                type: TransactionType.EXPENSE,
                date: { gt: now },
                userId: user.id
            },
            orderBy: { date: 'asc' }
        });

        // Group by month
        const projections: { year: number; month: number; amount: number; transactionCount: number }[] = [];

        for (let i = 0; i < monthsAhead; i++) {
            let projYear = currentYear;
            let projMonth = currentMonth + i;

            while (projMonth > 12) {
                projMonth -= 12;
                projYear++;
            }

            const { closingDate } = calculateSummaryDates(projYear, projMonth, closingDay, dueDay);

            // Previous closing date for range
            let prevMonth = projMonth - 1;
            let prevYear = projYear;
            if (prevMonth < 1) {
                prevMonth = 12;
                prevYear = projYear - 1;
            }
            const prevClosingDate = new Date(prevYear, prevMonth - 1, closingDay, 23, 59, 59);

            // Find transactions in this period
            // IMPORTANT: Only include transactions UP TO the closing day
            const monthStart = new Date(projYear, projMonth - 1, 1, 0, 0, 0);
            const closingCutoff = new Date(projYear, projMonth - 1, closingDay, 23, 59, 59);

            const periodTxs = futureTransactions.filter(tx => {
                const txDate = new Date(tx.date);
                // Option 1: Within closing period (previous closing to this closing)
                const inClosingPeriod = txDate > prevClosingDate && txDate <= closingDate;
                // Option 2: From start of month up to closing day (for edge cases)
                const inMonthBeforeClosing = txDate >= monthStart && txDate <= closingCutoff;
                return inClosingPeriod || inMonthBeforeClosing;
            });

            const amount = periodTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);

            projections.push({
                year: projYear,
                month: projMonth,
                amount,
                transactionCount: periodTxs.length
            });
        }

        return { success: true, projections };

    } catch (error) {
        console.error('Error getting projected summaries:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            projections: []
        };
    }
}

/**
 * Get current summary for a credit card (auto-generates if needed)
 */
export async function getCurrentSummary(productId: string) {
    const now = new Date();
    const { y, m } = getBAInfo(now);
    return generateSummary(productId, y, m);
}

/**
 * Reset summary: Remove all items and adjustments to start fresh
 */
export async function resetSummary(summaryId: string) {
    try {
        const user = await requireUser();

        const summary = await prisma.creditCardSummary.findUnique({
            where: { id: summaryId }
        });

        if (!summary || summary.userId !== user.id) {
            throw new Error('Resumen no encontrado');
        }

        if (summary.status === SummaryStatus.PAID) {
            throw new Error('No se puede resetear un resumen pagado');
        }

        await prisma.$transaction(async (tx) => {
            // 1. Force delete all items
            await tx.summaryItem.deleteMany({
                where: { summaryId: summary.id }
            });

            // 2. Force delete all adjustments
            await tx.summaryAdjustment.deleteMany({
                where: { summaryId: summary.id }
            });

            // 3. Reset summary totals and metadata
            await tx.creditCardSummary.update({
                where: { id: summary.id },
                data: {
                    calculatedAmount: 0,
                    adjustmentsAmount: 0,
                    totalAmount: 0,
                    status: SummaryStatus.DRAFT,
                    isClosed: false,
                    // Optionally clear dates if they are part of the problem
                }
            });
        });

        revalidatePath('/accounts');
        revalidatePath('/calendar');
        revalidatePath('/');

        return { success: true };

    } catch (error) {
        console.error('Error resetting summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
