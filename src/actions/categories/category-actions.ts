'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { CategoryType } from "@prisma/client";

/**
 * Obtiene todas las categorías del usuario
 */
export async function getCategories(type?: 'INCOME' | 'EXPENSE') {
    try {
        const user = await requireUser();

        const categories = await prisma.category.findMany({
            where: {
                userId: user.id,
                ...(type && { categoryType: type }),
            },
            orderBy: {
                name: 'asc',
            },
        });

        return { success: true, categories };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            categories: [],
        };
    }
}

/**
 * Crea una nueva categoría
 */
export async function createCategory(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser();

        const name = formData.get('name') as string;
        const icon = formData.get('icon') as string;
        const categoryType = formData.get('categoryType') as CategoryType;

        if (!name || name.trim() === '') {
            throw new Error('El nombre es requerido');
        }

        if (!categoryType) {
            throw new Error('El tipo de categoría es requerido');
        }

        // Verificar que no exista otra categoría con el mismo nombre y tipo
        const existing = await prisma.category.findFirst({
            where: {
                userId: user.id,
                name: name.trim(),
                categoryType,
            },
        });

        if (existing) {
            throw new Error(`Ya existe una categoría de ${categoryType === 'INCOME' ? 'ingreso' : 'egreso'} con ese nombre`);
        }

        await prisma.category.create({
            data: {
                name: name.trim(),
                icon: icon || null,
                categoryType,
                userId: user.id,
            },
        });


        try {
            revalidatePath('/transactions');
        } catch (e) {
            // Ignore revalidate errors
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating category:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategory(categoryId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser();

        const name = formData.get('name') as string;
        const icon = formData.get('icon') as string;
        const categoryType = formData.get('categoryType') as CategoryType;

        if (!name || name.trim() === '') {
            throw new Error('El nombre es requerido');
        }

        if (!categoryType) {
            throw new Error('El tipo de categoría es requerido');
        }

        // Verificar que la categoría exista y pertenezca al usuario
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            throw new Error('Categoría no encontrada');
        }

        if (category.userId !== user.id) {
            throw new Error('No autorizado');
        }

        if (category.isSystem) {
            throw new Error('No se pueden editar categorías del sistema');
        }

        // Verificar que no exista otra categoría con el mismo nombre y tipo
        const existing = await prisma.category.findFirst({
            where: {
                userId: user.id,
                name: name.trim(),
                categoryType,
                id: { not: categoryId },
            },
        });

        if (existing) {
            throw new Error(`Ya existe otra categoría de ${categoryType === 'INCOME' ? 'ingreso' : 'egreso'} con ese nombre`);
        }

        await prisma.category.update({
            where: { id: categoryId },
            data: {
                name: name.trim(),
                icon: icon || null,
                categoryType,
            },
        });


        try {
            revalidatePath('/transactions');
        } catch (e) {
            // Ignore revalidate errors
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating category:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Elimina una categoría
 */
export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser();

        // Verificar que la categoría exista y pertenezca al usuario
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
        });

        if (!category) {
            throw new Error('Categoría no encontrada');
        }

        if (category.userId !== user.id) {
            throw new Error('No autorizado');
        }

        if (category.isSystem) {
            throw new Error('No se pueden eliminar categorías del sistema');
        }

        // Verificar si tiene transacciones asociadas
        if (category._count.transactions > 0) {
            throw new Error(`No se puede eliminar la categoría porque tiene ${category._count.transactions} transacción(es) asociada(s)`);
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });


        try {
            revalidatePath('/transactions');
        } catch (e) {
            // Ignore revalidate errors
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting category:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}
