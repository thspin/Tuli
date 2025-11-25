'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TransactionType, ProductType } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

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

            if (fromProduct.type === ProductType.CREDIT_CARD) {
                // En tarjeta de crédito, el balance suele representar deuda (negativo) o disponible.
                // Asumimos que balance negativo = deuda.
                // Gasto de $1000 -> Balance disminuye $1000 (ej: de 0 a -1000)
                // Si hay interés, disminuye por el total financiado (ej: $1200)
                balanceChange = -totalDebtAmount;
            } else {
                // En efectivo/banco, gasto de $1000 -> Balance disminuye $1000
                balanceChange = -amount;
            }

            await tx.financialProduct.update({
                where: { id: fromProductId },
                data: {
                    balance: {
                        increment: balanceChange
                    }
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
