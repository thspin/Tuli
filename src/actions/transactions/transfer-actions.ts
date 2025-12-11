'use server'

import { prisma } from "@/src/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";

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
 * Crea una transferencia entre cuentas
 * Disminuye el balance del producto origen e incrementa el del destino
 */
export async function createTransfer(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getDemoUser();

        // Extraer datos del formulario
        const fromProductId = formData.get('fromProductId') as string;
        const toProductId = formData.get('toProductId') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string || 'Transferencia entre cuentas';
        const dateStr = formData.get('date') as string;

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
        const date = dateStr ? new Date(dateStr) : new Date();

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
        const allowedTypes = ['CASH', 'SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT'];
        if (!allowedTypes.includes(fromProduct.type)) {
            throw new Error('No se puede transferir desde tarjetas de crédito o préstamos');
        }
        if (!allowedTypes.includes(toProduct.type)) {
            throw new Error('No se puede transferir hacia tarjetas de crédito o préstamos');
        }

        // Validar misma moneda
        if (fromProduct.currency !== toProduct.currency) {
            throw new Error(`Las cuentas deben tener la misma moneda. Origen: ${fromProduct.currency}, Destino: ${toProduct.currency}`);
        }

        // Validar saldo suficiente
        if (Number(fromProduct.balance) < amount) {
            throw new Error(`Saldo insuficiente en la cuenta de origen. Disponible: ${fromProduct.currency} ${Number(fromProduct.balance).toFixed(2)}`);
        }

        // Crear transacción y actualizar balances en una transacción atómica
        await prisma.$transaction(async (tx) => {
            // 1. Crear la transacción de transferencia
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

            // 2. Decrementar el balance del producto origen
            await tx.financialProduct.update({
                where: { id: fromProductId },
                data: {
                    balance: {
                        decrement: amount,
                    },
                },
            });

            // 3. Incrementar el balance del producto destino
            await tx.financialProduct.update({
                where: { id: toProductId },
                data: {
                    balance: {
                        increment: amount,
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
        console.error('Error creating transfer:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}
