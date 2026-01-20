'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { parseLocalDatePicker } from "@/src/utils/date";
import { TransactionType } from "@prisma/client";

/**
 * Crea una transferencia entre cuentas
 * Disminuye el balance del producto origen e incrementa el del destino
 */
export async function createTransfer(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser();

        // Extraer datos del formulario
        const fromProductId = formData.get('fromProductId') as string;
        const toProductId = formData.get('toProductId') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string || 'Transferencia entre cuentas';
        const dateStr = formData.get('date') as string;
        const destinationAmountStr = formData.get('destinationAmount');
        const destinationAmount = destinationAmountStr ? parseFloat(destinationAmountStr as string) : undefined;

        // Validaciones básicas
        if (!fromProductId) {
            throw new Error('Debe seleccionar una cuenta de origen');
        }

        if (!toProductId) {
            throw new Error('Debe seleccionar una cuenta de destino');
        }

        if (fromProductId === toProductId) {
            throw new Error('La cuenta de origen y destino no pueden ser la misma');
        }

        if (!amount || amount <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }

        // Parsear fecha
        const date = dateStr ? parseLocalDatePicker(dateStr) : new Date();

        // Obtener ambos productos
        const [fromProduct, toProduct] = await Promise.all([
            prisma.financialProduct.findUnique({
                where: { id: fromProductId },
            }),
            prisma.financialProduct.findUnique({
                where: { id: toProductId },
            }),
        ]);

        if (!fromProduct) {
            throw new Error('Cuenta de origen no encontrada');
        }

        if (!toProduct) {
            throw new Error('Cuenta de destino no encontrada');
        }

        // Validar que los productos pertenezcan al usuario
        if (fromProduct.userId !== user.id || toProduct.userId !== user.id) {
            throw new Error('No tienes permisos para operar con estas cuentas');
        }

        // Validar tipos de productos permitidos
        const allowedTypes = ['CASH', 'SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'DEBIT_CARD', 'CREDIT_CARD'];
        if (!allowedTypes.includes(fromProduct.type)) {
            throw new Error(`No se puede transferir desde productos de tipo ${fromProduct.type}`);
        }
        if (!allowedTypes.includes(toProduct.type)) {
            throw new Error(`No se puede transferir hacia productos de tipo ${toProduct.type}`);
        }

        // Detectar cambio de moneda
        const isCrossCurrency = fromProduct.currency !== toProduct.currency;

        if (isCrossCurrency) {
            if (!destinationAmount || destinationAmount <= 0) {
                throw new Error('Para transferencias entre monedas distintas, se requiere el monto de destino');
            }
        }



        // Validar saldo suficiente
        if (Number(fromProduct.balance) < amount) {
            throw new Error(`Saldo insuficiente en la cuenta de origen. Disponible: ${fromProduct.currency} ${Number(fromProduct.balance).toFixed(2)}`);
        }

        // Crear transacción y actualizar balances en una transacción atómica
        await prisma.$transaction(async (tx) => {
            if (isCrossCurrency && destinationAmount) {
                // --- CROSS CURRENCY TRANSFER (Two Transactions) ---

                // 1. Outbound Transaction (Source Currency)
                await tx.transaction.create({
                    data: {
                        amount: amount, // Source Amount
                        date,
                        description: `${description} (Envío a ${toProduct.name})`,
                        type: TransactionType.TRANSFER,
                        userId: user.id,
                        fromProductId: fromProductId,
                        toProductId: undefined, // Unlinked to avoid confusion in single-currency views
                    },
                });

                // 2. Inbound Transaction (Destination Currency)
                await tx.transaction.create({
                    data: {
                        amount: destinationAmount, // Destination Amount
                        date,
                        description: `${description} (Recepción desde ${fromProduct.name})`,
                        type: TransactionType.TRANSFER,
                        userId: user.id,
                        fromProductId: fromProductId, // Keep fromProductId for reference if possible, but schema requires Valid ID if present.
                        toProductId: toProductId,
                    },
                });

                // 3. Decrement Source Balance
                await tx.financialProduct.update({
                    where: { id: fromProductId },
                    data: { balance: { decrement: amount } },
                });

                // 4. Increment Destination Balance
                await tx.financialProduct.update({
                    where: { id: toProductId },
                    data: { balance: { increment: destinationAmount } },
                });

            } else {
                // --- SAME CURRENCY TRANSFER (Single Transaction) ---

                // 1. Create Transaction
                await tx.transaction.create({
                    data: {
                        amount,
                        date,
                        description,
                        type: TransactionType.TRANSFER,
                        userId: user.id,
                        fromProductId: fromProductId,
                        toProductId: toProductId,
                    },
                });

                // 2. Decrement Source
                await tx.financialProduct.update({
                    where: { id: fromProductId },
                    data: { balance: { decrement: amount } },
                });

                // 3. Increment Destination
                await tx.financialProduct.update({
                    where: { id: toProductId },
                    data: { balance: { increment: amount } },
                });
            }
        });

        try {
            revalidatePath('/accounts');
            revalidatePath('/transactions');
        } catch (e) {
            // Ignore revalidate errors
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating transfer:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}
