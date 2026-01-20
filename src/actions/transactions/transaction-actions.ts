'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { TransactionType, ProductType } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { serializeTransaction } from "@/src/utils/serializers";
import { parseLocalDatePicker } from "@/src/utils/date";

// --- Zod Schemas ---

const createTransactionSchema = z.object({
    description: z.string().min(1, "La descripción es requerida"),
    amount: z.coerce.number().positive("El monto debe ser positivo"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    fromProductId: z.string().uuid("Producto de origen inválido"),
    categoryId: z.string().uuid().optional().or(z.literal('')),
    installments: z.coerce.number().int().min(1).default(1),
    installmentAmount: z.coerce.number().positive().optional(),
    planZ: z.coerce.boolean().optional(),
    type: z.enum(['EXPENSE', 'INCOME']).optional().default('EXPENSE'),
});

const updateTransactionSchema = z.object({
    description: z.string().min(1, "La descripción es requerida"),
    amount: z.coerce.number().positive("El monto debe ser positivo"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    categoryId: z.string().uuid().optional().or(z.literal('')),
    planZ: z.coerce.boolean().optional(),
});

const paymentSchema = z.object({
    description: z.string().min(1),
    amount: z.coerce.number().positive(),
    date: z.string(),
    fromProductId: z.string().uuid(),
    toProductId: z.string().uuid(),
    paymentType: z.string().optional()
});

export async function createTransaction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const rawData = Object.fromEntries(formData.entries());
        if (rawData.planZ === 'on') rawData.planZ = 'true';

        const validated = createTransactionSchema.parse(rawData);

        const { description, amount, date: dateStr, fromProductId, categoryId, installments, installmentAmount, planZ, type } = validated;

        const date = parseLocalDatePicker(dateStr);
        const user = await requireUser();

        // Obtener producto de origen para verificar tipo
        const fromProduct = await prisma.financialProduct.findUnique({
            where: { id: fromProductId },
            include: { institution: true }
        });

        if (!fromProduct) {
            throw new Error('Producto de origen no encontrado');
        }

        // Validar cuotas solo para tarjetas de crédito
        if (installments > 1 && fromProduct.type !== ProductType.CREDIT_CARD) {
            throw new Error('Las cuotas solo están permitidas para tarjetas de crédito');
        }

        // Generar ID de grupo de cuotas si son múltiples
        const installmentId = installments > 1 ? uuidv4() : null;

        // Determinar el monto de cada cuota:
        const finalInstallmentAmount = (installments > 1 && installmentAmount)
            ? installmentAmount
            : amount / installments;

        // Calcular el monto total real de la deuda (puede incluir interés)
        const totalDebtAmount = installments > 1
            ? finalInstallmentAmount * installments
            : amount;

        // Crear transacciones (una por cuota)
        const transactionsToCreate: any[] = [];

        for (let i = 0; i < installments; i++) {
            const transactionDate = new Date(date);
            transactionDate.setMonth(transactionDate.getMonth() + i);

            transactionsToCreate.push({
                amount: installments > 1 ? finalInstallmentAmount : amount,
                date: transactionDate,
                description: installments > 1 ? `${description} (Cuota ${i + 1}/${installments})` : description,
                type: type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
                fromProductId: type === 'EXPENSE' ? fromProductId : undefined,
                toProductId: type === 'INCOME' ? fromProductId : undefined, // For INC, fromProductId is actually the destination account
                category: categoryId ? { connect: { id: categoryId } } : undefined,
                userId: user.id,
                installmentNumber: installments > 1 ? i + 1 : null,
                installmentTotal: installments > 1 ? installments : null,
                planZ: !!planZ,
                installmentId,
            });
        }

        // Ejecutar transacción en base de datos
        await prisma.$transaction(async (tx) => {
            // 1. Crear registros de transacción
            if (planZ && installments === 1) {
                const txData = transactionsToCreate[0];
                const { planZ: _, category, ...rest } = txData;

                const createdTx = await tx.transaction.create({
                    data: {
                        ...rest,
                        categoryId: category?.connect?.id || null
                    }
                });

                const planZBool = true;
                // @ts-ignore
                await tx.$executeRaw`UPDATE "Transaction" SET "planZ" = ${planZBool} WHERE "id" = ${createdTx.id}`;
            } else {
                await tx.transaction.createMany({
                    data: transactionsToCreate.map(({ planZ, category, ...t }) => ({
                        ...t,
                        categoryId: category?.connect?.id || null
                    }))
                });
            }

            // 2. Actualizar saldo del producto
            let balanceChange = 0;
            let targetProductIdForBalanceUpdate = fromProductId;
            let limitUpdate: { limitSinglePayment?: { increment: number }, limitInstallments?: { increment: number } } = {};

            if (fromProduct.type === ProductType.DEBIT_CARD) {
                if (!fromProduct.linkedProductId) {
                    throw new Error('Tarjeta de débito sin cuenta vinculada');
                }

                const linkedProduct = await tx.financialProduct.findUnique({
                    where: { id: fromProduct.linkedProductId }
                });

                if (!linkedProduct) {
                    throw new Error('Cuenta vinculada no encontrada');
                }

                if (Number(linkedProduct.balance) < amount) {
                    throw new Error(`Saldo insuficiente en la caja de ahorro vinculada (${linkedProduct.name})`);
                }

                targetProductIdForBalanceUpdate = fromProduct.linkedProductId;
                balanceChange = -amount;

            } else if (fromProduct.type === ProductType.CREDIT_CARD) {
                const isInstallmentPurchase = installments > 1;
                const hasUnifiedLimit = fromProduct.unifiedLimit;

                // Solo validar límites si existen (no son null)
                const hasLimits = fromProduct.limitSinglePayment !== null ||
                    fromProduct.limitInstallments !== null ||
                    fromProduct.limit !== null;

                if (hasLimits) {
                    if (hasUnifiedLimit) {
                        const currentLimit = Number(fromProduct.limitSinglePayment || fromProduct.limit || 0);
                        const currentBalance = Number(fromProduct.balance);
                        const availableLimit = currentLimit + currentBalance;

                        if (availableLimit < totalDebtAmount) {
                            throw new Error(`Límite insuficiente. Disponible: $${availableLimit.toFixed(2)}, Necesario: $${totalDebtAmount.toFixed(2)}`);
                        }

                        limitUpdate.limitSinglePayment = { increment: -totalDebtAmount };
                        limitUpdate.limitInstallments = { increment: -totalDebtAmount };
                    } else {
                        if (isInstallmentPurchase) {
                            const currentLimit = Number(fromProduct.limitInstallments || fromProduct.limit || 0);
                            const currentBalance = Number(fromProduct.balance);
                            const availableLimit = currentLimit + currentBalance;

                            if (availableLimit < totalDebtAmount) {
                                throw new Error(`Límite insuficiente en cuotas. Disponible: $${availableLimit.toFixed(2)}, Necesario: $${totalDebtAmount.toFixed(2)}`);
                            }
                            limitUpdate.limitInstallments = { increment: -totalDebtAmount };
                        } else {
                            const currentLimit = Number(fromProduct.limitSinglePayment || fromProduct.limit || 0);
                            const currentBalance = Number(fromProduct.balance);
                            const availableLimit = currentLimit + currentBalance;

                            if (availableLimit < amount) {
                                throw new Error(`Límite insuficiente en un pago. Disponible: $${availableLimit.toFixed(2)}, Necesario: $${amount.toFixed(2)}`);
                            }
                            limitUpdate.limitSinglePayment = { increment: -amount };
                        }
                    }
                }
                // Si no hay límites, no validar ni actualizar límites
                balanceChange = -totalDebtAmount;
            } else if (type === 'INCOME') {
                balanceChange = amount;
                // Income goes TO the account, so target is fromProductId (mapped to target above)
                targetProductIdForBalanceUpdate = fromProductId;
            } else {
                balanceChange = -amount;
            }

            const balanceUpdateData: any = {
                balance: { increment: balanceChange }
            };

            if (Object.keys(limitUpdate).length > 0) {
                Object.assign(balanceUpdateData, limitUpdate);
            }

            await tx.financialProduct.update({
                where: { id: targetProductIdForBalanceUpdate },
                data: balanceUpdateData
            });
        });

        revalidatePath('/accounts');
        return { success: true };

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        console.error('Error creating transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Actualiza una transacción existente
 */
export async function updateTransaction(
    id: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    try {
        const rawData = Object.fromEntries(formData.entries());
        if (rawData.planZ === 'on') rawData.planZ = 'true';

        const validated = updateTransactionSchema.parse(rawData);
        const { description, amount, date: dateStr, categoryId, planZ } = validated;

        const date = parseLocalDatePicker(dateStr);
        const user = await requireUser();

        // Obtener la transacción actual
        const currentTransaction = await prisma.transaction.findUnique({
            where: { id },
            include: { fromProduct: true, toProduct: true }
        });

        if (!currentTransaction) {
            throw new Error('Transacción no encontrada');
        }

        if (currentTransaction.userId !== user.id) {
            throw new Error('No autorizado');
        }

        // Calcular la diferencia de monto para ajustar balances
        const amountDiff = amount - Number(currentTransaction.amount);

        await prisma.$transaction(async (tx) => {
            // Actualizar la transacción
            await tx.transaction.update({
                where: { id },
                data: {
                    description,
                    amount,
                    date,
                    category: categoryId ? { connect: { id: categoryId } } : { disconnect: true },
                    planZ: planZ !== undefined ? planZ : currentTransaction.planZ,
                }
            });

            // Si es una compra en cuotas, actualizar la categoría para todas las cuotas del grupo
            if (currentTransaction.installmentId) {
                await tx.transaction.updateMany({
                    where: {
                        installmentId: currentTransaction.installmentId,
                        userId: user.id
                    },
                    data: {
                        categoryId: categoryId || null,
                    }
                });
            }

            // Ajustar balances si el monto cambió
            if (amountDiff !== 0 && currentTransaction.fromProduct) {
                const productType = currentTransaction.fromProduct.type;

                if (productType === ProductType.CREDIT_CARD) {
                    const updateData: any = {
                        balance: { increment: -amountDiff }
                    };

                    // Solo actualizar límites si existen
                    const hasLimits = currentTransaction.fromProduct.limitSinglePayment !== null ||
                        currentTransaction.fromProduct.limitInstallments !== null ||
                        currentTransaction.fromProduct.limit !== null;

                    if (hasLimits) {
                        if (!currentTransaction.installmentTotal) {
                            updateData.limitSinglePayment = { increment: -amountDiff };
                        } else {
                            updateData.limitInstallments = { increment: -amountDiff };
                        }
                    }

                    await tx.financialProduct.update({
                        where: { id: currentTransaction.fromProductId! },
                        data: updateData
                    });
                } else if (productType === ProductType.DEBIT_CARD) {
                    if (currentTransaction.fromProduct.linkedProductId) {
                        await tx.financialProduct.update({
                            where: { id: currentTransaction.fromProduct.linkedProductId },
                            data: {
                                balance: { increment: -amountDiff }
                            }
                        });
                    }
                } else {
                    await tx.financialProduct.update({
                        where: { id: currentTransaction.fromProductId! },
                        data: {
                            balance: { increment: -amountDiff }
                        }
                    });
                }
            }

            if (amountDiff !== 0 && currentTransaction.toProduct && currentTransaction.type === TransactionType.TRANSFER) {
                await tx.financialProduct.update({
                    where: { id: currentTransaction.toProductId! },
                    data: {
                        balance: { increment: amountDiff }
                    }
                });
            }
        });

        revalidatePath('/accounts');
        revalidatePath('/transactions');
        return { success: true };

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        console.error('Error updating transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Elimina una transacción y revierte los cambios de balance
 */
export async function deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser();

        // Obtener la transacción
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: { fromProduct: true, toProduct: true }
        });

        if (!transaction) {
            throw new Error('Transacción no encontrada');
        }

        if (transaction.userId !== user.id) {
            throw new Error('No autorizado');
        }

        const amount = Number(transaction.amount);

        await prisma.$transaction(async (tx) => {
            // Revertir el cambio de balance según el tipo de transacción
            if (transaction.type === TransactionType.EXPENSE && transaction.fromProduct) {
                const productType = transaction.fromProduct.type;

                if (productType === ProductType.CREDIT_CARD) {
                    const updateData: any = {
                        balance: { increment: amount } // Reducir deuda
                    };

                    // Solo actualizar límites si existen
                    const hasLimits = transaction.fromProduct.limitSinglePayment !== null ||
                        transaction.fromProduct.limitInstallments !== null ||
                        transaction.fromProduct.limit !== null;

                    if (hasLimits) {
                        if (!transaction.installmentTotal) {
                            updateData.limitSinglePayment = { increment: amount };
                        } else {
                            updateData.limitInstallments = { increment: amount };
                        }
                    }

                    await tx.financialProduct.update({
                        where: { id: transaction.fromProductId! },
                        data: updateData
                    });
                } else if (productType === ProductType.DEBIT_CARD) {
                    if (transaction.fromProduct.linkedProductId) {
                        await tx.financialProduct.update({
                            where: { id: transaction.fromProduct.linkedProductId },
                            data: {
                                balance: { increment: amount }
                            }
                        });
                    }
                } else {
                    await tx.financialProduct.update({
                        where: { id: transaction.fromProductId! },
                        data: {
                            balance: { increment: amount }
                        }
                    });
                }
            } else if (transaction.type === TransactionType.INCOME && transaction.toProduct) {
                await tx.financialProduct.update({
                    where: { id: transaction.toProductId! },
                    data: {
                        balance: { increment: -amount }
                    }
                });
            } else if (transaction.type === TransactionType.TRANSFER) {
                if (transaction.fromProductId) {
                    await tx.financialProduct.update({
                        where: { id: transaction.fromProductId },
                        data: {
                            balance: { increment: amount }
                        }
                    });
                }
                if (transaction.toProductId && transaction.toProduct?.type === ProductType.CREDIT_CARD) {
                    const updateData: any = {
                        balance: { increment: -amount }
                    };

                    // Solo actualizar límites si existen
                    const hasLimits = transaction.toProduct.limitSinglePayment !== null ||
                        transaction.toProduct.limitInstallments !== null ||
                        transaction.toProduct.limit !== null;

                    if (hasLimits) {
                        updateData.limitSinglePayment = { increment: -amount };
                    }

                    await tx.financialProduct.update({
                        where: { id: transaction.toProductId },
                        data: updateData
                    });
                } else if (transaction.toProductId) {
                    await tx.financialProduct.update({
                        where: { id: transaction.toProductId },
                        data: {
                            balance: { increment: -amount }
                        }
                    });
                }
            }

            await tx.transaction.delete({
                where: { id }
            });
        });

        revalidatePath('/accounts');
        revalidatePath('/transactions');
        return { success: true };

    } catch (error) {
        console.error('Error deleting transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Obtiene todas las transacciones del usuario
 */
export async function getTransactions(limit?: number) {
    try {
        const user = await requireUser();

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id
            },
            include: {
                fromProduct: {
                    include: { institution: true }
                },
                toProduct: {
                    include: { institution: true }
                },
                category: true
            },
            orderBy: {
                date: 'desc'
            },
            take: limit
        });

        return {
            success: true,
            transactions: transactions.map(serializeTransaction)
        };
    } catch (error) {
        console.error('Error getting transactions:', error);
        return {
            success: false,
            error: "Error al obtener las transacciones",
            transactions: []
        };
    }
}

/**
 * Obtiene una transacción por su ID
 */
export async function getTransactionById(id: string) {
    try {
        const user = await requireUser();

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                fromProduct: {
                    include: { institution: true }
                },
                toProduct: {
                    include: { institution: true }
                },
                category: true
            }
        });

        if (!transaction) {
            return { success: false, error: "Transacción no encontrada" };
        }

        if (transaction.userId !== user.id) {
            return { success: false, error: "No autorizado" };
        }

        return {
            success: true,
            transaction: serializeTransaction(transaction)
        };
    } catch (error) {
        console.error('Error getting transaction:', error);
        return {
            success: false,
            error: "Error al obtener la transacción"
        };
    }
}

// ... (previous code)

/**
 * Obtiene transacciones de gasto que no están vinculadas a ninguna boleta de servicio
 * Útil para machear pagos manuales con boletas
 */
export async function getUnlinkedTransactions(startDate: Date, endDate: Date, categoryId?: string) {
    try {
        const user = await requireUser();

        const whereClause: any = {
            userId: user.id,
            date: {
                gte: startDate,
                lte: endDate
            },
            type: TransactionType.EXPENSE,
            serviceBill: null
        };

        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                fromProduct: {
                    include: { institution: true }
                },
                category: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        return {
            success: true,
            transactions: transactions.map(serializeTransaction)
        };
    } catch (error) {
        console.error('Error getting unlinked transactions:', error);
        return {
            success: false,
            error: "Error al obtener transacciones",
            transactions: []
        };
    }
}
