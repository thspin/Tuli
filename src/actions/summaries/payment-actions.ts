'use server'

import { prisma } from "@/src/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { ProductType } from "@prisma/client";

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

/**
 * Paga un resumen de tarjeta de crédito
 */
export async function payOffSummary(
    summaryId: string,
    paymentProductId: string,
    extraCharges: Array<{ description: string, amount: string, category: string }> = [],
    transactionCategories: Array<{ transactionId: string, categoryId: string }> = [],
    unexplainedBalanceCategory?: { description: string, categoryId: string, amount: number }
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getDemoUser();

        // Obtener el resumen
        const summary = await prisma.creditCardSummary.findUnique({
            where: { id: summaryId },
            include: {
                product: true,
            },
        });

        if (!summary) {
            throw new Error('Resumen no encontrado');
        }

        if (summary.userId !== user.id) {
            throw new Error('No autorizado');
        }

        const summaryAmount = Number(summary.totalAmount);
        const extrasTotal = extraCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || '0'), 0);
        const totalPaymentAmount = summaryAmount + extrasTotal;

        // Obtener el producto de pago
        const paymentProduct = await prisma.financialProduct.findUnique({
            where: { id: paymentProductId },
        });

        if (!paymentProduct) {
            throw new Error('Cuenta de pago no encontrada');
        }

        // Validar que no sea préstamo o tarjeta de crédito
        if (paymentProduct.type === ProductType.LOAN || paymentProduct.type === ProductType.CREDIT_CARD) {
            throw new Error('No puedes pagar con préstamos o tarjetas de crédito');
        }

        // Validar que tenga saldo suficiente
        const paymentBalance = Number(paymentProduct.balance);
        if (paymentBalance < totalPaymentAmount) {
            throw new Error(`Saldo insuficiente. Disponible: $${paymentBalance.toFixed(2)}, Necesario: $${totalPaymentAmount.toFixed(2)}`);
        }

        // Ejecutar transacción
        await prisma.$transaction(async (tx) => {
            // 1. Descontar el monto total de la cuenta de pago
            await tx.financialProduct.update({
                where: { id: paymentProductId },
                data: {
                    balance: {
                        decrement: totalPaymentAmount,
                    },
                },
            });

            // 2. Restaurar el balance de la tarjeta (pagar el resumen)
            await tx.financialProduct.update({
                where: { id: summary.productId },
                data: {
                    balance: {
                        increment: summaryAmount,
                    },
                },
            });

            // 3. Actualizar categorías de transacciones que estaban sin categorizar
            for (const { transactionId, categoryId } of transactionCategories) {
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: { categoryId },
                });
            }

            // 4. Si hay saldo sin explicar, crear transacción para ese monto
            if (unexplainedBalanceCategory && unexplainedBalanceCategory.amount > 0) {
                await tx.transaction.create({
                    data: {
                        amount: unexplainedBalanceCategory.amount,
                        date: new Date(),
                        description: unexplainedBalanceCategory.description,
                        type: 'EXPENSE',
                        fromProductId: paymentProductId,
                        categoryId: unexplainedBalanceCategory.categoryId,
                        userId: user.id,
                    },
                });
            }

            // 5. Marcar el resumen como cerrado
            await tx.creditCardSummary.update({
                where: { id: summaryId },
                data: {
                    isClosed: true,
                },
            });

            // 6. Crear registro de transacción del pago del resumen
            await tx.transaction.create({
                data: {
                    amount: summaryAmount,
                    date: new Date(),
                    description: `Pago resumen ${summary.month}/${summary.year} - ${summary.product.name}`,
                    type: 'TRANSFER',
                    fromProductId: paymentProductId,
                    toProductId: summary.productId,
                    userId: user.id,
                },
            });

            // 7. Crear transacciones individuales para cada gasto adicional
            // Los gastos extras son EGRESOS que se pagan desde la cuenta, no nueva deuda de la tarjeta
            for (const charge of extraCharges) {
                const chargeAmount = parseFloat(charge.amount || '0');
                if (chargeAmount > 0 && charge.description.trim()) {
                    // Crear transacción del gasto extra como EGRESO desde la cuenta de pago
                    await tx.transaction.create({
                        data: {
                            amount: chargeAmount,
                            date: new Date(),
                            description: `${charge.description} - ${summary.product.name}`,
                            type: 'EXPENSE',
                            fromProductId: paymentProductId, // Desde la cuenta de pago, no desde la tarjeta
                            categoryId: charge.category || null, // Usar la categoría provista
                            userId: user.id,
                        },
                    });
                    // NO se modifica el balance de la tarjeta porque ya se descontó todo del pago
                }
            }
        });

        try {
            revalidatePath('/summaries');
            revalidatePath('/accounts');
        } catch (e) {
            // Ignore revalidate errors in non-Next.js context
        }

        return { success: true };
    } catch (error) {
        console.error('Error paying off summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Obtiene productos disponibles para pagar un resumen
 */
export async function getPaymentAccounts(summaryAmount: number) {
    try {
        const user = await getDemoUser();

        // Obtener productos que NO sean préstamos ni tarjetas de crédito
        // Y que tengan saldo suficiente
        const accounts = await prisma.financialProduct.findMany({
            where: {
                userId: user.id,
                type: {
                    in: [ProductType.CASH, ProductType.SAVINGS_ACCOUNT, ProductType.CHECKING_ACCOUNT, ProductType.DEBIT_CARD],
                },
                balance: {
                    gte: summaryAmount,
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Convertir Decimals a numbers
        const accountsWithNumbers = accounts.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            currency: a.currency,
            balance: Number(a.balance),
        }));

        return { success: true, accounts: accountsWithNumbers };
    } catch (error) {
        console.error('Error fetching payment accounts:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}
