'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { parseLocalDatePicker } from "@/src/utils/date";

/**
 * Registra un "Ingreso por crédito": toma dinero prestado de una tarjeta de crédito
 * Crea:
 * 1. Un ingreso en la cuenta destino (ej: Astropay +100)
 * 2. Un consumo en la tarjeta de crédito (ej: VISA Galicia +105)
 * 3. Un consumo adicional por comisión en la tarjeta (ej: +5 con categoría "Intereses")
 */
export async function addIncomeByCredit(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser();

        // Extraer datos del formulario
        const productId = formData.get('productId') as string; // Cuenta destino
        const creditCardProductId = formData.get('creditCardProductId') as string; // Tarjeta de crédito origen
        const amount = parseFloat(formData.get('amount') as string); // Monto recibido
        const commission = parseFloat(formData.get('commission') as string); // Comisión
        const description = formData.get('description') as string;
        const categoryId = formData.get('categoryId') as string;
        const dateStr = formData.get('date') as string;

        // Validaciones
        if (!productId) {
            throw new Error('Debe seleccionar una cuenta de destino');
        }

        if (!creditCardProductId) {
            throw new Error('Debe seleccionar una tarjeta de crédito');
        }

        if (!amount || amount <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }

        if (isNaN(commission) || commission < 0) {
            throw new Error('La comisión debe ser un valor válido');
        }

        if (!description || description.trim() === '') {
            throw new Error('La descripción es requerida');
        }

        // Parsear fecha correctamente para evitar problemas de timezone
        const date = dateStr ? parseLocalDatePicker(dateStr) : new Date();

        // Obtener el producto destino
        const destinationProduct = await prisma.financialProduct.findUnique({
            where: { id: productId },
        });

        if (!destinationProduct) {
            throw new Error('Cuenta de destino no encontrada');
        }

        // Obtener la tarjeta de crédito
        const creditCardProduct = await prisma.financialProduct.findUnique({
            where: { id: creditCardProductId },
        });

        if (!creditCardProduct || creditCardProduct.type !== 'CREDIT_CARD') {
            throw new Error('La tarjeta de crédito no es válida');
        }

        // Buscar la categoría "Intereses" para la comisión
        const interestCategory = await prisma.category.findFirst({
            where: {
                userId: user.id,
                name: { contains: 'Intereses', mode: 'insensitive' }
            }
        });

        if (!interestCategory) {
            throw new Error('No se encontró la categoría "Intereses". Por favor créala primero.');
        }

        // Crear todas las transacciones en una transacción atómica
        await prisma.$transaction(async (tx) => {
            // 1. Crear el ingreso en la cuenta destino
            // IMPORTANTE: Nunca debe ser Plan Z (es un pago único, no financiación)
            await tx.transaction.create({
                data: {
                    amount,
                    date,
                    description,
                    type: 'INCOME',
                    categoryId: categoryId || null,
                    userId: user.id,
                    fromProductId: productId,
                    planZ: false, // Ingreso por crédito es siempre en una cuota
                },
            });

            // 2. Incrementar el balance de la cuenta destino
            await tx.financialProduct.update({
                where: { id: productId },
                data: {
                    balance: {
                        increment: amount,
                    },
                },
            });

            // 3. Crear el cargo principal en la tarjeta de crédito (el monto recibido)
            // IMPORTANTE: Nunca debe ser Plan Z (es un pago único, no financiación)
            await tx.transaction.create({
                data: {
                    amount,
                    date,
                    description: `Adelanto - ${description}`,
                    type: 'EXPENSE',
                    categoryId: categoryId || null,
                    userId: user.id,
                    fromProductId: creditCardProductId,
                    planZ: false, // Ingreso por crédito es siempre en una cuota
                },
            });

            // 4. Si hay comisión, crear una transacción separada con categoría "Intereses"
            // IMPORTANTE: Nunca debe ser Plan Z (es un pago único, no financiación)
            if (commission > 0) {
                await tx.transaction.create({
                    data: {
                        amount: commission,
                        date,
                        description: `Comisión por adelanto - ${description}`,
                        type: 'EXPENSE',
                        categoryId: interestCategory.id,
                        userId: user.id,
                        fromProductId: creditCardProductId,
                        planZ: false, // Ingreso por crédito es siempre en una cuota
                    },
                });
            }

            // 5. Decrementar el balance de la tarjeta de crédito (aumentar deuda)
            // El total es monto + comisión
            const totalCharge = amount + commission;
            await tx.financialProduct.update({
                where: { id: creditCardProductId },
                data: {
                    balance: {
                        decrement: totalCharge,
                    },
                },
            });
        });

        try {
            revalidatePath('/accounts');
            revalidatePath('/transactions');
        } catch (e) {
            // Ignore revalidate errors
        }

        return { success: true };
    } catch (error) {
        console.error('Error adding income by credit:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}
