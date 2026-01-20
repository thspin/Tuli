'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import type {
    ParsedStatement,
    ParsedTransaction,
    ReconciliationResult,
    ReconciliationItem,
    AdjustmentReconciliationItem,
    ImportResult,
} from '@/src/types';
import {
    amountsMatch,
    datesWithinDays,
    stringSimilarity,
} from '@/src/utils/pdf-parser';
import { parsePDFStatement } from '@/src/utils/pdf-parsers';
import { AdjustmentType, SummaryStatus } from "@prisma/client";
import { generateSummary } from '@/src/actions/summaries/summary-actions';

const BA_TZ = 'America/Argentina/Buenos_Aires';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse a PDF statement file
 */
export async function parsePDFStatementAction(
    formData: FormData,
    intendedInstitution?: string
): Promise<{
    success: boolean;
    statement?: ParsedStatement;
    error?: string;
}> {
    try {
        const file = formData.get('file') as File;
        const password = formData.get('password') as string | null;

        if (!file) {
            return { success: false, error: 'No se proporcionó ningún archivo.' };
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return { success: false, error: 'El archivo debe ser un PDF.' };
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'El archivo es demasiado grande (máximo 10MB).' };
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await parsePDFStatement(
            arrayBuffer,
            intendedInstitution as any,
            password || undefined
        );

        return result;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Reconcile a parsed statement with existing transactions
 */
export async function reconcileStatementAction(
    statement: ParsedStatement,
    productId: string
): Promise<{
    success: boolean;
    reconciliation?: ReconciliationResult;
    error?: string;
}> {
    try {
        const user = await requireUser();

        // Get the product
        const product = await prisma.financialProduct.findUnique({
            where: { id: productId, userId: user.id },
            include: { institution: true },
        });

        if (!product || product.type !== 'CREDIT_CARD') {
            return { success: false, error: 'Producto no encontrado o no es una tarjeta de crédito.' };
        }

        const closingDay = product.closingDay || 15;

        // Calculate previous closing date for the period
        let prevMonth = statement.statementMonth - 1;
        let prevYear = statement.statementYear;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear--;
        }
        const prevClosingDate = new Date(prevYear, prevMonth - 1, closingDay, 23, 59, 59);

        // Get existing transactions for this card in the period
        const existingTransactions = await prisma.transaction.findMany({
            where: {
                fromProductId: productId,
                type: 'EXPENSE',
                date: {
                    gt: prevClosingDate,
                    // Extend search to due date + 5 days to catch transactions dated in the payment month
                    // (User error common case: setting date to 1st of payment month instead of closing period)
                    lte: new Date(statement.dueDate.getTime() + 5 * 24 * 60 * 60 * 1000),
                },
                userId: user.id,
            },
            include: { category: true },
        });

        // Check if summary exists
        const isShared = product.institution?.shareSummary || false;
        const existingSummary = await prisma.creditCardSummary.findFirst({
            where: {
                institutionId: isShared ? product.institutionId : null,
                productId,
                year: statement.statementYear,
                month: statement.statementMonth,
            },
            include: { adjustments: true },
        });

        // Reconcile transactions
        const reconciliationItems: ReconciliationItem[] = [];
        const matchedDbTxIds = new Set<string>();

        // --- NARANJA X SPECIAL HANDLING: DATA FILTERING ---
        let statementToReconcile = { ...statement };

        if (statement.institution === 'naranja' && product.institution?.name.toLowerCase().includes('naranja') && !isShared) {
            const productName = product.name.toLowerCase();
            let cardFilter: string[] = [];

            if (productName.includes('visa')) {
                cardFilter = ['NX Visa'];
            } else if (productName.includes('mastercard') || productName.includes('master')) {
                cardFilter = ['NX Master', 'NX Mastercard'];
            } else if (productName.includes('naranja') || productName.includes('virtual')) {
                cardFilter = ['NX Virtual', 'Naranja X'];
            }

            if (cardFilter.length > 0) {
                console.log(`[Import] Naranja detected. Filtering for card(s): ${cardFilter.join(', ')}`);

                // Filter transactions
                statementToReconcile.transactions = statement.transactions.filter(
                    tx => tx.isPayment || (tx.cardName && cardFilter.includes(tx.cardName))
                );

                // Filter adjustments - only those with our card name or those without any card name (global)
                // For global adjustments, we attribute them to "Naranja X" (physical card) usually
                const isPrincipalCard = cardFilter.includes('Naranja X');
                statementToReconcile.adjustments = statement.adjustments.filter(
                    adj => (adj.cardName && cardFilter.includes(adj.cardName)) || (!adj.cardName && isPrincipalCard)
                );

                // Calculate the correct total for THIS card
                const cardTotals = statement.cardBreakdown?.filter(b => cardFilter.includes(b.cardName));
                if (cardTotals && cardTotals.length > 0) {
                    const totalARS = cardTotals.reduce((sum, b) => sum + b.totalARS, 0);
                    const adjustmentsTotal = statementToReconcile.adjustments.reduce((sum, a) => sum + a.amount, 0);
                    statementToReconcile.totalAmount = totalARS + adjustmentsTotal;
                    console.log(`[Import] New total for ${product.name}: ${statementToReconcile.totalAmount} (Breakdown: ${totalARS} + Adjustments: ${adjustmentsTotal})`);
                }
            }
        }

        for (const pdfTx of statementToReconcile.transactions) {
            if (pdfTx.isPayment) continue; // Skip payments

            let bestMatch: ReconciliationItem = {
                pdfTransaction: pdfTx,
                matchType: 'not_found',
                confidence: 0,
            };

            for (const dbTx of existingTransactions) {
                if (matchedDbTxIds.has(dbTx.id)) continue;

                // Check amount match (exact centavos) - comparing absolute values to handle DB negative expenses
                const amountMatches = amountsMatch(Math.abs(pdfTx.amount), Math.abs(Number(dbTx.amount)));
                if (!amountMatches) continue;

                // Check date (within 1 day)
                const dateMatches = datesWithinDays(pdfTx.date, dbTx.date, 1);

                // For installments, we're more lenient with dates because banks often list 
                // the original purchase date instead of the current installment date.
                const isInstallment = (pdfTx.installmentTotal && pdfTx.installmentTotal > 1) ||
                    (dbTx.installmentTotal && dbTx.installmentTotal > 1) ||
                    pdfTx.description.toLowerCase().includes('cuota') ||
                    dbTx.description.toLowerCase().includes('cuota');

                // Check specific installment match (strongest signal)
                // Note: We now only require same installment NUMBER, not total, as banks sometimes refinance
                const exactInstallmentMatch = isInstallment &&
                    pdfTx.installmentCurrent &&
                    dbTx.installmentNumber &&
                    pdfTx.installmentCurrent === dbTx.installmentNumber;

                // Check description similarity
                const similarity = stringSimilarity(pdfTx.description, dbTx.description);

                let matchType: ReconciliationItem['matchType'] = 'not_found';
                let confidence = 0;

                // DATE MATCH LOGIC
                // 1. Exact Installment Match: Same amount + Same installment number (ignores date/desc diffs and total installments)
                if (amountMatches && exactInstallmentMatch) {
                    matchType = 'exact';
                    confidence = 98; // Very high confidence
                }
                // 2. Strong installment match: Same amount + description + is installment
                // This handles cases where installment totals differ (e.g. 7/12 in PDF vs 1/6 in DB due to refinancing)
                else if (amountMatches && isInstallment && similarity >= 80) {
                    matchType = 'exact';
                    confidence = 95; // High confidence for installments with same amount and description
                }
                // 3. Regular match: amount + date + similarity
                else if (amountMatches && dateMatches && similarity >= 50) {
                    matchType = 'exact';
                    confidence = 90 + Math.min(10, similarity / 10);
                }
                // 4. Flexible match for installments: amount + similarity (if in same summary period)
                // If the user has different installment counts (e.g. 7/12 vs 1/6) but description/amount match, we still match
                else if (amountMatches && isInstallment && similarity >= 60) {
                    matchType = 'exact'; // We treat it as exact if it's an installment in the right period
                    confidence = 85 + Math.min(10, similarity / 10);
                }
                // 5. Partial matches
                else if (amountMatches && dateMatches) {
                    matchType = 'partial';
                    confidence = 70 + similarity / 5;
                } else if (amountMatches && similarity >= 70) {
                    matchType = 'partial';
                    confidence = 50 + similarity / 5;
                }

                if (confidence > bestMatch.confidence) {
                    bestMatch = {
                        pdfTransaction: pdfTx,
                        matchedTransactionId: dbTx.id,
                        matchedTransaction: {
                            id: dbTx.id,
                            date: dbTx.date,
                            description: dbTx.description,
                            amount: Number(dbTx.amount),
                            categoryId: dbTx.categoryId || undefined,
                        },
                        matchType,
                        confidence,
                    };
                }
            }

            if (bestMatch.matchedTransactionId) {
                matchedDbTxIds.add(bestMatch.matchedTransactionId);
            }

            reconciliationItems.push(bestMatch);
        }

        // Reconcile adjustments
        const adjustmentItems: AdjustmentReconciliationItem[] = [];

        for (const pdfAdj of statementToReconcile.adjustments) {
            const existingAdj = existingSummary?.adjustments.find(
                a => a.type === mapAdjustmentType(pdfAdj.type) &&
                    amountsMatch(Number(a.amount), pdfAdj.amount)
            );

            adjustmentItems.push({
                pdfAdjustment: pdfAdj,
                existingAdjustmentId: existingAdj?.id,
                alreadyExists: !!existingAdj,
                shouldApply: !existingAdj,
            });
        }

        // Calculate summary
        const exactMatches = reconciliationItems.filter(i => i.matchType === 'exact').length;
        const partialMatches = reconciliationItems.filter(i => i.matchType === 'partial').length;
        const notFound = reconciliationItems.filter(i => i.matchType === 'not_found').length;
        const discrepancies = reconciliationItems.filter(i => i.matchType === 'discrepancy').length;

        const pdfTotal = statementToReconcile.transactions
            .filter(t => !t.isPayment)
            .reduce((sum, t) => sum + t.amount, 0);
        const dbTotal = existingTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

        const reconciliation: ReconciliationResult = {
            statement: statementToReconcile,
            productId,
            summaryId: existingSummary?.id,
            needsNewSummary: !existingSummary,
            transactions: reconciliationItems,
            adjustments: adjustmentItems,
            summary: {
                exactMatches,
                partialMatches,
                notFound,
                discrepancies,
                totalPDFTransactions: statementToReconcile.transactions.filter(t => !t.isPayment).length,
                totalDBTransactions: existingTransactions.length,
                amountDifference: pdfTotal - dbTotal,
            },
            datesToUpdate: {
                closingDate: statementToReconcile.closingDate,
                dueDate: statementToReconcile.dueDate,
                previousClosingDate: statementToReconcile.previousClosingDate,
                previousDueDate: statementToReconcile.previousDueDate,
            },
        };

        return { success: true, reconciliation };
    } catch (error) {
        console.error('Error reconciling statement:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Apply the import after user confirmation
 */
export async function applyStatementImportAction(
    reconciliation: ReconciliationResult,
    confirmedItems: {
        transactionId: string;
        action: 'accept' | 'reject' | 'create_new';
    }[],
    createMissingTransactions: boolean = true
): Promise<ImportResult> {
    try {
        const user = await requireUser();
        let createdTransactions = 0;
        let updatedTransactions = 0;
        let createdAdjustments = 0;
        const errors: string[] = [];

        const product = await prisma.financialProduct.findUnique({
            where: { id: reconciliation.productId, userId: user.id },
            include: { institution: true }
        });

        if (!product) {
            return { success: false, message: 'Producto no encontrado.', createdTransactions: 0, updatedTransactions: 0, createdAdjustments: 0 };
        }

        await prisma.$transaction(async (tx) => {
            // 1. Create or update summary
            let summaryId = reconciliation.summaryId;

            if (reconciliation.needsNewSummary) {
                const isShared = product?.institution?.shareSummary || false;
                const newSummary = await tx.creditCardSummary.create({
                    data: {
                        institutionId: isShared ? product?.institutionId : null,
                        productId: reconciliation.productId,
                        year: reconciliation.statement.statementYear,
                        month: reconciliation.statement.statementMonth,
                        closingDate: reconciliation.statement.closingDate,
                        dueDate: reconciliation.statement.dueDate,
                        totalAmount: reconciliation.statement.totalAmount,
                        status: SummaryStatus.DRAFT,
                        userId: user.id,
                    },
                });
                summaryId = newSummary.id;
            } else if (summaryId && reconciliation.datesToUpdate) {
                // Update dates
                await tx.creditCardSummary.update({
                    where: { id: summaryId },
                    data: {
                        closingDate: reconciliation.datesToUpdate.closingDate,
                        dueDate: reconciliation.datesToUpdate.dueDate,
                        totalAmount: reconciliation.statement.totalAmount,
                    },
                });
            }

            // 2. Create missing transactions
            if (createMissingTransactions) {
                for (const item of reconciliation.transactions) {
                    const confirmation = confirmedItems.find(
                        c => c.transactionId === (item.matchedTransactionId || item.pdfTransaction.description)
                    );

                    // Create new transaction if not found or user chose create_new
                    if (item.matchType === 'not_found' || confirmation?.action === 'create_new') {
                        const pdfTx = item.pdfTransaction;

                        try {
                            // Create current transaction
                            const installmentId = pdfTx.installmentTotal && pdfTx.installmentTotal > 1 ? uuidv4() : undefined;

                            await tx.transaction.create({
                                data: {
                                    amount: pdfTx.amount,
                                    date: pdfTx.date, // This date is correct for THIS summary
                                    description: pdfTx.description,
                                    type: 'EXPENSE',
                                    fromProductId: reconciliation.productId,
                                    userId: user.id,
                                    installmentNumber: pdfTx.installmentCurrent,
                                    installmentTotal: pdfTx.installmentTotal,
                                    installmentId: installmentId,
                                    planZ: pdfTx.isPlanZ,
                                },
                            });
                            createdTransactions++;

                            // Create FUTURE installments if applicable
                            if (installmentId && pdfTx.installmentTotal && pdfTx.installmentCurrent && pdfTx.installmentCurrent < pdfTx.installmentTotal) {
                                const closingDay = product.closingDay || 15;
                                let baseDate = new Date(pdfTx.date);

                                for (let i = pdfTx.installmentCurrent + 1; i <= pdfTx.installmentTotal; i++) {
                                    // Calculate the installment month relative to current
                                    const monthOffset = i - pdfTx.installmentCurrent;

                                    // Calculate target month/year
                                    const targetMonth = baseDate.getMonth() + monthOffset;
                                    const targetYear = baseDate.getFullYear() + Math.floor(targetMonth / 12);
                                    const normalizedMonth = ((targetMonth % 12) + 12) % 12; // Handle negative months

                                    // Use a date within the closing period: the closing day itself
                                    // This ensures the installment appears in the correct summary
                                    // For a card with closing day 10, an installment in "January" should have a date 
                                    // between Dec 11 and Jan 10. We'll use Jan 10 (the closing day of that month).
                                    const installmentDate = new Date(targetYear, normalizedMonth, closingDay, 12, 0, 0);

                                    // Handle edge case: if day doesn't exist in month (e.g. Feb 30), use last day of month
                                    if (installmentDate.getMonth() !== normalizedMonth) {
                                        installmentDate.setDate(0); // Go to last day of previous month
                                    }

                                    try {
                                        await tx.transaction.create({
                                            data: {
                                                amount: pdfTx.amount, // Assuming fixed installments
                                                date: installmentDate,
                                                description: pdfTx.description,
                                                type: 'EXPENSE',
                                                fromProductId: reconciliation.productId,
                                                userId: user.id,
                                                installmentNumber: i,
                                                installmentTotal: pdfTx.installmentTotal,
                                                installmentId: installmentId,
                                                planZ: pdfTx.isPlanZ,
                                                status: 'PENDING'
                                            }
                                        });
                                        // We don't increment createdTransactions to avoid confusing the user on THIS summary import count
                                        // but they are being created in the background.
                                    } catch (futureErr) {
                                        console.error(`Failed to create future installment ${i}:`, futureErr);
                                    }
                                }
                                console.log(`Created ${pdfTx.installmentTotal - pdfTx.installmentCurrent} future installments for ${pdfTx.description}`);
                            }
                        } catch (e) {
                            errors.push(`Error creando transacción "${pdfTx.description}": ${e}`);
                        }
                    }
                }
            }

            // 2.5. Create SummaryItems for matched transactions
            // This links existing transactions to the summary (e.g. installments from previous months)
            if (summaryId) {
                for (const item of reconciliation.transactions) {
                    // Only create items for matched transactions (not for newly created ones, those will be picked up by generateSummary)
                    if (item.matchType === 'exact' || item.matchType === 'partial') {
                        if (item.matchedTransactionId) {
                            try {
                                // Check if item already exists
                                const existingItem = await tx.summaryItem.findUnique({
                                    where: {
                                        summaryId_transactionId: {
                                            summaryId,
                                            transactionId: item.matchedTransactionId
                                        }
                                    }
                                });

                                if (!existingItem) {
                                    await tx.summaryItem.create({
                                        data: {
                                            summaryId,
                                            transactionId: item.matchedTransactionId,
                                            amount: item.matchedTransaction!.amount,
                                            isReconciled: item.matchType === 'exact',
                                            hasDiscrepancy: item.matchType === 'partial',
                                        }
                                    });
                                }
                            } catch (e) {
                                errors.push(`Error vinculando transacción "${item.pdfTransaction.description}": ${e}`);
                            }
                        }
                    }
                }
            }

            // 3. Create adjustments
            if (summaryId) {
                for (const adjItem of reconciliation.adjustments) {
                    if (adjItem.shouldApply && !adjItem.alreadyExists) {
                        try {
                            await tx.summaryAdjustment.create({
                                data: {
                                    summaryId,
                                    type: mapAdjustmentType(adjItem.pdfAdjustment.type),
                                    description: adjItem.pdfAdjustment.description,
                                    amount: adjItem.pdfAdjustment.amount,
                                },
                            });
                            createdAdjustments++;
                        } catch (e) {
                            errors.push(`Error creando ajuste "${adjItem.pdfAdjustment.description}": ${e}`);
                        }
                    }
                }

                // Update summary totals
                const allAdjustments = await tx.summaryAdjustment.findMany({
                    where: { summaryId },
                });
                const adjustmentsAmount = allAdjustments.reduce((sum, a) => sum + Number(a.amount), 0);

                // Also calculate items total for consistency
                const allItems = await tx.summaryItem.findMany({
                    where: { summaryId },
                });
                const calculatedAmount = allItems.reduce((sum, item) => sum + Number(item.amount), 0);

                await tx.creditCardSummary.update({
                    where: { id: summaryId },
                    data: {
                        calculatedAmount,
                        adjustmentsAmount,
                        // Use PDF total as the authoritative source
                        totalAmount: reconciliation.statement.totalAmount,
                    },
                });
            }

            // 4. Create FUTURE summary if next period dates are available
            // This allows the calendar to show the *real* closing/due date of the next period
            if (reconciliation.statement.nextClosingDate && reconciliation.statement.nextDueDate) {
                const nextClosing = reconciliation.statement.nextClosingDate;
                const nextDue = reconciliation.statement.nextDueDate;

                // Calculate next period's month/year relative to current statement
                // This ensures we respect the parser's logic (e.g. Due Date based vs Closing Date based)
                let nextMonth = reconciliation.statement.statementMonth + 1;
                let nextYear = reconciliation.statement.statementYear;

                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear++;
                }

                // Check if a summary already exists for that period
                const existingNextSummary = await tx.creditCardSummary.findFirst({
                    where: {
                        productId: reconciliation.productId,
                        year: nextYear,
                        month: nextMonth
                    }
                });

                if (existingNextSummary) {
                    // Update dates if they differ
                    if (existingNextSummary.closingDate.getTime() !== nextClosing.getTime() ||
                        existingNextSummary.dueDate.getTime() !== nextDue.getTime()) {
                        await tx.creditCardSummary.update({
                            where: { id: existingNextSummary.id },
                            data: {
                                closingDate: nextClosing,
                                dueDate: nextDue
                            }
                        });
                        console.log('Updated next summary dates based on PDF info');
                    }
                } else {
                    // Create empty draft summary for next month with correct dates
                    await tx.creditCardSummary.create({
                        data: {
                            productId: reconciliation.productId,
                            year: nextYear,
                            month: nextMonth,
                            closingDate: nextClosing,
                            dueDate: nextDue,
                            totalAmount: 0, // No amount yet
                            status: SummaryStatus.DRAFT,
                            userId: user.id
                        }
                    });
                    console.log('Created future summary based on PDF info');
                }

                // Force regeneration of the future summary to pick up the newly created future installments
                // We do this AFTER the transaction explicitly to avoid locking issues/race conditions, 
                // although generateSummary handles its own logic. 
                // Since we are inside a transaction here (tx), and generateSummary opens its own context,
                // keep in mind isolate effects. But here we just want to trigger it.
                // BETTER: Do it outside the transaction or just trust it works since we created the Txs in this Tx?
                // Transactions created in `tx` won't be visible to `generateSummary` (new prisma client call) until `tx` commits.
                // So we should capture the params and run it AFTER the transaction commits.
            }

            // 5. Update Product "Next Closing" preferences for accurate future estimates
            if (reconciliation.statement.nextClosingDate || reconciliation.statement.nextDueDate) {
                const updateData: any = {};
                if (reconciliation.statement.nextClosingDate) {
                    updateData.closingDay = reconciliation.statement.nextClosingDate.getDate();
                }
                if (reconciliation.statement.nextDueDate) {
                    updateData.dueDay = reconciliation.statement.nextDueDate.getDate();
                }

                if (Object.keys(updateData).length > 0) {
                    await tx.financialProduct.update({
                        where: { id: reconciliation.productId },
                        data: updateData
                    });
                    console.log('Updated product preferences with next closing details', updateData);
                }
            }
        }, { timeout: 40000 });

        // Regenerate future summary if needed (outside the main transaction)
        if (reconciliation.statement.nextClosingDate) {
            const nextClosing = reconciliation.statement.nextClosingDate;
            const nextMonth = nextClosing.getMonth() + 1;
            const nextYear = nextClosing.getFullYear();
            // Run in background / don't await to not block UI? 
            // Better await to ensure consistency for immediate refresh.
            try {
                await generateSummary(reconciliation.productId, nextYear, nextMonth);
            } catch (e) {
                console.error('Error regenerating future summary:', e);
            }
        }

        revalidatePath('/accounts');
        revalidatePath('/transactions');
        revalidatePath('/calendar');

        return {
            success: true,
            message: `Importación completada. ${createdTransactions} transacciones creadas, ${createdAdjustments} ajustes agregados.`,
            summaryId: reconciliation.summaryId,
            createdTransactions,
            updatedTransactions,
            createdAdjustments,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error) {
        console.error('Error applying import:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error desconocido',
            createdTransactions: 0,
            updatedTransactions: 0,
            createdAdjustments: 0,
        };
    }
}

/**
 * Map PDF adjustment type to Prisma AdjustmentType
 */
function mapAdjustmentType(type: string): AdjustmentType {
    switch (type) {
        case 'TAX':
            return AdjustmentType.TAX;
        case 'INTEREST':
            return AdjustmentType.INTEREST;
        case 'COMMISSION':
            return AdjustmentType.COMMISSION;
        case 'INSURANCE':
            return AdjustmentType.INSURANCE;
        case 'CREDIT':
            return AdjustmentType.CREDIT;
        default:
            return AdjustmentType.OTHER;
    }
}
