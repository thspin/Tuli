'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
 * Registra un ingreso de dinero en un producto
 */
export async function addIncome(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getDemoUser();

        // Extraer datos del formulario
        const productId = formData.get('productId') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string;
        const categoryId = formData.get('categoryId') as string;
        const dateStr = formData.get('date') as string;

        // Validaciones
        if (!productId) {
            throw new Error('Debe seleccionar un producto');
        }

        if (!amount || amount <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }

        if (!description || description.trim() === '') {
            throw new Error('La descripción es requerida');
        }

        // Parsear fecha
        const date = dateStr ? new Date(dateStr) : new Date();

        // Obtener el producto
        const product = await prisma.financialProduct.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new Error('Producto no encontrado');
        }

        // Validar que el tipo de producto permita ingresos
        // No se puede ingresar dinero en tarjetas de crédito ni préstamos
        const allowedTypes = ['CASH', 'SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'DEBIT_CARD'];
        if (!allowedTypes.includes(product.type)) {
            throw new Error('No puedes ingresar dinero en tarjetas de crédito o préstamos');
        }

        // Crear transacción y actualizar balance en una transacción atómica
        await prisma.$transaction(async (tx) => {
            // 1. Crear la transacción de ingreso
            await tx.transaction.create({
                data: {
                    amount,
                    date,
                    description,
                    type: 'INCOME',
                    categoryId: categoryId || null,
                    userId: user.id,
                    fromProductId: productId,
                },
            });

            // 2. Incrementar el balance del producto
            await tx.financialProduct.update({
                where: { id: productId },
                data: {
                    balance: {
                        increment: amount,
                    },
                },
            });
        });

        try {
            revalidatePath('/accounts');
        } catch (e) {
            // Ignore revalidate errors
        }

        return { success: true };
    } catch (error) {
        console.error('Error adding income:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

