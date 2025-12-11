'use server'

import { prisma } from "@/src/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { TransactionType, ProductType } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

// --- HELPER: Deep Serialization to eliminate ALL Decimal issues ---
/**
 * Recursively converts Prisma Decimal objects to Numbers throughout the entire object tree.
 * This prevents "Decimal objects are not supported" errors when passing data to Client Components.
 */
function deepSerialize(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle Decimal objects (check constructor name and duck typing)
    if (
        obj.constructor?.name === 'Decimal' ||
        (typeof obj === 'object' && 'd' in obj && 'e' in obj && 's' in obj)
    ) {
        return Number(obj);
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return obj;
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(item => deepSerialize(item));
    }

    // Handle plain objects
    if (typeof obj === 'object') {
        const serialized: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                serialized[key] = deepSerialize(obj[key]);
            }
        }
        return serialized;
    }

    // Primitive values (string, number, boolean)
    return obj;
}

/**
 * Obtiene o crea el usuario demo
 */
async function getDemoUser() {
    const userEmail = 'demo@financetracker.com';
    let user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: userEmail,
                name: 'Usuario Demo',
            }
        });
    }

    return user;
}

export async function createTransaction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const description = formData.get('description') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const dateStr = formData.get('date') as string;
        const fromProductId = formData.get('fromProductId') as string;
        const categoryId = formData.get('categoryId') as string; // Optional for now
        const installments = parseInt(formData.get('installments') as string) || 1;

        console.log('createTransaction called', {
            description,
            amount,
            dateStr,
            fromProductId,
            installments,
            installmentAmount: formData.get('installmentAmount')
        });

        if (!description || isNaN(amount) || !dateStr || !fromProductId) {
            throw new Error('Descripción, monto, fecha y cuenta de origen son requeridos');
        }

        const date = new Date(dateStr);
        const user = await getDemoUser();

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

        const installmentAmountCustom = formData.get('installmentAmount') ? parseFloat(formData.get('installmentAmount') as string) : null;

        // Generar ID de grupo de cuotas si son múltiples
        const installmentId = installments > 1 ? uuidv4() : null;

        // Determinar el monto de cada cuota:
        // Si viene un monto personalizado (con interés), usamos ese.
        // Si no, dividimos el monto total por la cantidad de cuotas.
        const finalInstallmentAmount = (installments > 1 && installmentAmountCustom)
            ? installmentAmountCustom
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
                type: TransactionType.EXPENSE, // Por ahora asumimos gasto
                fromProductId,
                categoryId: categoryId || null,
                userId: user.id,
                installmentNumber: installments > 1 ? i + 1 : null,
                installmentTotal: installments > 1 ? installments : null,
                installmentId,
            });
        }

        // Ejecutar transacción en base de datos
        await prisma.$transaction(async (tx) => {
            // 1. Crear registros de transacción
            await tx.transaction.createMany({
                data: transactionsToCreate
            });

            // 2. Actualizar saldo del producto
            // Si es tarjeta de crédito, el saldo (deuda) aumenta por el TOTAL de la compra inmediatamente
            // Si es débito/efectivo, el saldo disminuye por el TOTAL (si es un solo pago)

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
                // Determinar qué límite usar según si es en cuotas o no
                const isInstallmentPurchase = installments > 1;
                const hasUnifiedLimit = fromProduct.unifiedLimit;

                if (hasUnifiedLimit) {
                    // Si tiene límite unificado, validar contra cualquiera de los dos (son iguales)
                    // y actualizar ambos con el mismo monto
                    const currentLimit = Number(fromProduct.limitSinglePayment || fromProduct.limit || 0);
                    const currentBalance = Number(fromProduct.balance);
                    const availableLimit = currentLimit + currentBalance; // balance es negativo (deuda)

                    if (availableLimit < totalDebtAmount) {
                        throw new Error(`Límite insuficiente. Disponible: $${availableLimit.toFixed(2)}, Necesario: $${totalDebtAmount.toFixed(2)}`);
                    }

                    // Actualizar ambos límites (disminuyen por el mismo monto)
                    limitUpdate.limitSinglePayment = { increment: -totalDebtAmount };
                    limitUpdate.limitInstallments = { increment: -totalDebtAmount };
                } else {
                    // Lógica original para límites separados
                    // Verificar límite disponible
                    if (isInstallmentPurchase) {
                        const currentLimit = Number(fromProduct.limitInstallments || fromProduct.limit || 0);
                        const currentBalance = Number(fromProduct.balance);
                        const availableLimit = currentLimit + currentBalance; // balance es negativo (deuda)

                        if (availableLimit < totalDebtAmount) {
                            throw new Error(`Límite insuficiente en cuotas. Disponible: $${availableLimit.toFixed(2)}, Necesario: $${totalDebtAmount.toFixed(2)}`);
                        }

                        // Actualizar límite en cuotas (disminuye)
                        limitUpdate.limitInstallments = { increment: -totalDebtAmount };
                    } else {
                        const currentLimit = Number(fromProduct.limitSinglePayment || fromProduct.limit || 0);
                        const currentBalance = Number(fromProduct.balance);
                        const availableLimit = currentLimit + currentBalance;

                        if (availableLimit < amount) {
                            throw new Error(`Límite insuficiente en un pago. Disponible: $${availableLimit.toFixed(2)}, Necesario: $${amount.toFixed(2)}`);
                        }

                        // Actualizar límite en un pago (disminuye)
                        limitUpdate.limitSinglePayment = { increment: -amount };
                    }
                }

                balanceChange = -totalDebtAmount;
            } else {
                // En efectivo/banco, gasto de $1000 -> Balance disminuye $1000
                balanceChange = -amount;
            }

            await tx.financialProduct.update({
                where: { id: targetProductIdForBalanceUpdate },
                data: {
                    balance: {
                        increment: balanceChange
                    },
                    ...limitUpdate
                }
            });
        });

        revalidatePath('/accounts');
        return { success: true };

    } catch (error) {
        console.error('Error creating transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Crear un pago a tarjeta de crédito
 * Esto reduce la deuda (aumenta el balance) y repone los límites
 */
export async function createPayment(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const description = formData.get('description') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const dateStr = formData.get('date') as string;
        const fromProductId = formData.get('fromProductId') as string; // Cuenta desde donde se paga
        const toProductId = formData.get('toProductId') as string; // Tarjeta que se paga
        const paymentType = formData.get('paymentType') as string; // 'single' o 'installments'

        if (!description || isNaN(amount) || !dateStr || !fromProductId || !toProductId) {
            throw new Error('Todos los campos son requeridos');
        }

        const date = new Date(dateStr);
        const user = await getDemoUser();

        // Verificar que la cuenta de origen tenga saldo
        const fromProduct = await prisma.financialProduct.findUnique({
            where: { id: fromProductId }
        });

        if (!fromProduct) {
            throw new Error('Cuenta de origen no encontrada');
        }

        if (Number(fromProduct.balance) < amount) {
            throw new Error('Saldo insuficiente en la cuenta de origen');
        }

        // Verificar que el destino sea una tarjeta de crédito
        const toProduct = await prisma.financialProduct.findUnique({
            where: { id: toProductId }
        });

        if (!toProduct || toProduct.type !== ProductType.CREDIT_CARD) {
            throw new Error('El destino debe ser una tarjeta de crédito');
        }

        await prisma.$transaction(async (tx) => {
            // Crear la transacción de pago
            await tx.transaction.create({
                data: {
                    amount,
                    date,
                    description,
                    type: TransactionType.TRANSFER,
                    fromProductId,
                    toProductId,
                    userId: user.id,
                }
            });

            // Descontar de la cuenta de origen
            await tx.financialProduct.update({
                where: { id: fromProductId },
                data: {
                    balance: {
                        increment: -amount
                    }
                }
            });

            // Pagar la tarjeta (reduce deuda/aumenta balance) y reponer límite
            const limitUpdate: {
                limitSinglePayment?: { increment: number },
                limitInstallments?: { increment: number }
            } = {};

            // Si la tarjeta tiene límite unificado, reponer ambos límites
            if (toProduct.unifiedLimit) {
                limitUpdate.limitSinglePayment = { increment: amount };
                limitUpdate.limitInstallments = { increment: amount };
            } else {
                // Determinar qué límite reponer según el tipo de pago
                if (paymentType === 'installments') {
                    limitUpdate.limitInstallments = { increment: amount };
                } else {
                    // Por defecto, reponer límite de un pago
                    limitUpdate.limitSinglePayment = { increment: amount };
                }
            }

            await tx.financialProduct.update({
                where: { id: toProductId },
                data: {
                    balance: {
                        increment: amount // Reduce la deuda (balance negativo + pago = menos deuda)
                    },
                    ...limitUpdate
                }
            });
        });

        revalidatePath('/accounts');
        return { success: true };

    } catch (error) {
        console.error('Error creating payment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Carga masiva de transacciones
 */
export async function createBulkTransactions(
    transactions: Array<{
        date: string;
        productId: string;
        amount: string;
        categoryId: string;
        description: string;
        installments: number;
        installmentAmount: string;
    }>
): Promise<{ success: boolean; error?: string; createdCount?: number }> {
    try {
        const user = await getDemoUser();
        let createdCount = 0;
        const errors: string[] = [];

        // Process each transaction
        for (const txData of transactions) {
            try {
                const amount = parseFloat(txData.amount);
                const date = new Date(txData.date);
                const fromProductId = txData.productId;
                const categoryId = txData.categoryId || null;
                const installments = Number(txData.installments) || 1;

                if (!txData.description || isNaN(amount) || !txData.date || !fromProductId) {
                    errors.push(`Transacción inválida: ${txData.description || 'Sin descripción'}`);
                    continue;
                }

                // Get product to verify type
                const fromProduct = await prisma.financialProduct.findUnique({
                    where: { id: fromProductId },
                    include: { institution: true }
                });

                if (!fromProduct) {
                    errors.push(`Producto no encontrado: ${txData.description}`);
                    continue;
                }

                // Validate installments for credit cards only
                if (installments > 1 && fromProduct.type !== ProductType.CREDIT_CARD) {
                    errors.push(`Cuotas solo permitidas para tarjetas: ${txData.description}`);
                    continue;
                }

                const installmentAmountCustom = txData.installmentAmount ? parseFloat(txData.installmentAmount) : null;
                const installmentId = installments > 1 ? uuidv4() : null;

                const finalInstallmentAmount = (installments > 1 && installmentAmountCustom)
                    ? installmentAmountCustom
                    : amount / installments;

                const totalDebtAmount = installments > 1
                    ? finalInstallmentAmount * installments
                    : amount;

                // Create transactions (one per installment)
                const transactionsToCreate: any[] = [];

                for (let i = 0; i < installments; i++) {
                    const transactionDate = new Date(date);
                    transactionDate.setMonth(transactionDate.getMonth() + i);

                    transactionsToCreate.push({
                        amount: installments > 1 ? finalInstallmentAmount : amount,
                        date: transactionDate,
                        description: installments > 1 ? `${txData.description} (Cuota ${i + 1}/${installments})` : txData.description,
                        type: TransactionType.EXPENSE,
                        fromProductId,
                        categoryId,
                        userId: user.id,
                        installmentNumber: installments > 1 ? i + 1 : null,
                        installmentTotal: installments > 1 ? installments : null,
                        installmentId,
                    });
                }

                // Execute transaction in database
                await prisma.$transaction(async (tx) => {
                    // 1. Create transaction records
                    await tx.transaction.createMany({
                        data: transactionsToCreate
                    });

                    // 2. Update product balance
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
                            throw new Error(`Saldo insuficiente: ${fromProduct.name}`);
                        }

                        targetProductIdForBalanceUpdate = fromProduct.linkedProductId;
                        balanceChange = -amount;

                    } else if (fromProduct.type === ProductType.CREDIT_CARD) {
                        const isInstallmentPurchase = installments > 1;
                        const hasUnifiedLimit = fromProduct.unifiedLimit;

                        if (hasUnifiedLimit) {
                            const currentLimit = Number(fromProduct.limitSinglePayment || fromProduct.limit || 0);
                            const currentBalance = Number(fromProduct.balance);
                            const availableLimit = currentLimit + currentBalance;

                            if (availableLimit < totalDebtAmount) {
                                throw new Error(`Límite insuficiente: ${fromProduct.name}`);
                            }

                            limitUpdate.limitSinglePayment = { increment: -totalDebtAmount };
                            limitUpdate.limitInstallments = { increment: -totalDebtAmount };
                        } else {
                            if (isInstallmentPurchase) {
                                const currentLimit = Number(fromProduct.limitInstallments || fromProduct.limit || 0);
                                const currentBalance = Number(fromProduct.balance);
                                const availableLimit = currentLimit + currentBalance;

                                if (availableLimit < totalDebtAmount) {
                                    throw new Error(`Límite insuficiente en cuotas: ${fromProduct.name}`);
                                }

                                limitUpdate.limitInstallments = { increment: -totalDebtAmount };
                            } else {
                                const currentLimit = Number(fromProduct.limitSinglePayment || fromProduct.limit || 0);
                                const currentBalance = Number(fromProduct.balance);
                                const availableLimit = currentLimit + currentBalance;

                                if (availableLimit < amount) {
                                    throw new Error(`Límite insuficiente: ${fromProduct.name}`);
                                }

                                limitUpdate.limitSinglePayment = { increment: -amount };
                            }
                        }

                        balanceChange = -totalDebtAmount;
                    } else {
                        balanceChange = -amount;
                    }

                    await tx.financialProduct.update({
                        where: { id: targetProductIdForBalanceUpdate },
                        data: {
                            balance: {
                                increment: balanceChange
                            },
                            ...limitUpdate
                        }
                    });
                });

                createdCount++;
            } catch (error) {
                errors.push(`Error en "${txData.description}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        }

        revalidatePath('/accounts');

        if (errors.length > 0 && createdCount === 0) {
            return {
                success: false,
                error: 'No se pudo crear ninguna transacción:\n' + errors.join('\n')
            };
        }

        if (errors.length > 0) {
            return {
                success: true,
                createdCount,
                error: `${createdCount} transacciones creadas. Errores:\n` + errors.join('\n')
            };
        }

        return {
            success: true,
            createdCount
        };

    } catch (error) {
        console.error('Error in bulk transaction creation:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Obtiene transacciones con filtros opcionales
 */
export async function getTransactions(filters?: {
    institutionId?: string;
    productId?: string;
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
}) {
    try {
        const user = await getDemoUser();

        const where: any = {
            userId: user.id,
        };

        // Filtro por producto
        if (filters?.productId) {
            where.OR = [
                { fromProductId: filters.productId },
                { toProductId: filters.productId }
            ];
        }

        // Filtro por institución (necesitamos buscar productos de esa institución)
        if (filters?.institutionId && !filters?.productId) {
            const products = await prisma.financialProduct.findMany({
                where: { institutionId: filters.institutionId },
                select: { id: true }
            });
            const productIds = products.map(p => p.id);
            where.OR = [
                { fromProductId: { in: productIds } },
                { toProductId: { in: productIds } }
            ];
        }

        // Filtro por tipo
        if (filters?.type) {
            where.type = filters.type;
        }

        // Filtro por rango de fechas
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.date.lte = new Date(filters.endDate);
            }
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                    }
                },
                fromProduct: {
                    select: {
                        id: true,
                        name: true,
                        currency: true,
                        type: true,
                        institution: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            }
                        }
                    }
                },
                toProduct: {
                    select: {
                        id: true,
                        name: true,
                        currency: true,
                        type: true,
                        institution: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return {
            success: true,
            transactions: deepSerialize(transactions)
        };

    } catch (error) {
        console.error('Error getting transactions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            transactions: []
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
        const description = formData.get('description') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const dateStr = formData.get('date') as string;
        const categoryId = formData.get('categoryId') as string;

        if (!description || isNaN(amount) || !dateStr) {
            throw new Error('Descripción, monto y fecha son requeridos');
        }

        const date = new Date(dateStr);
        const user = await getDemoUser();

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
                    categoryId: categoryId || null,
                }
            });

            // Ajustar balances si el monto cambió
            if (amountDiff !== 0 && currentTransaction.fromProduct) {
                const productType = currentTransaction.fromProduct.type;

                if (productType === ProductType.CREDIT_CARD) {
                    // Para tarjeta de crédito, monto mayor = más deuda
                    await tx.financialProduct.update({
                        where: { id: currentTransaction.fromProductId! },
                        data: {
                            balance: { increment: -amountDiff },
                            limitSinglePayment: currentTransaction.installmentTotal
                                ? undefined
                                : { increment: -amountDiff },
                            limitInstallments: currentTransaction.installmentTotal
                                ? { increment: -amountDiff }
                                : undefined,
                        }
                    });
                } else if (productType === ProductType.DEBIT_CARD) {
                    // Para débito, actualizar cuenta vinculada
                    if (currentTransaction.fromProduct.linkedProductId) {
                        await tx.financialProduct.update({
                            where: { id: currentTransaction.fromProduct.linkedProductId },
                            data: {
                                balance: { increment: -amountDiff }
                            }
                        });
                    }
                } else {
                    // Efectivo u otros
                    await tx.financialProduct.update({
                        where: { id: currentTransaction.fromProductId! },
                        data: {
                            balance: { increment: -amountDiff }
                        }
                    });
                }
            }

            // Para transferencias, ajustar también el destino
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
        const user = await getDemoUser();

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
                    // Restaurar balance y límite
                    await tx.financialProduct.update({
                        where: { id: transaction.fromProductId! },
                        data: {
                            balance: { increment: amount }, // Reducir deuda
                            limitSinglePayment: transaction.installmentTotal
                                ? undefined
                                : { increment: amount },
                            limitInstallments: transaction.installmentTotal
                                ? { increment: amount }
                                : undefined,
                        }
                    });
                } else if (productType === ProductType.DEBIT_CARD) {
                    // Restaurar en cuenta vinculada
                    if (transaction.fromProduct.linkedProductId) {
                        await tx.financialProduct.update({
                            where: { id: transaction.fromProduct.linkedProductId },
                            data: {
                                balance: { increment: amount }
                            }
                        });
                    }
                } else {
                    // Efectivo u otros - restaurar balance
                    await tx.financialProduct.update({
                        where: { id: transaction.fromProductId! },
                        data: {
                            balance: { increment: amount }
                        }
                    });
                }
            } else if (transaction.type === TransactionType.INCOME && transaction.toProduct) {
                // Ingreso: restar del destino
                await tx.financialProduct.update({
                    where: { id: transaction.toProductId! },
                    data: {
                        balance: { increment: -amount }
                    }
                });
            } else if (transaction.type === TransactionType.TRANSFER) {
                // Transferencia: revertir ambos
                if (transaction.fromProductId) {
                    await tx.financialProduct.update({
                        where: { id: transaction.fromProductId },
                        data: {
                            balance: { increment: amount }
                        }
                    });
                }
                if (transaction.toProductId && transaction.toProduct?.type === ProductType.CREDIT_CARD) {
                    // Si era un pago a tarjeta de crédito
                    await tx.financialProduct.update({
                        where: { id: transaction.toProductId },
                        data: {
                            balance: { increment: -amount },
                            limitSinglePayment: { increment: -amount },
                        }
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

            // Eliminar la transacción
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

