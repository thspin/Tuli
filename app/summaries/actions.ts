'use server'

import { prisma } from "@/lib/prisma";
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
 * Calcula las fechas de cierre y vencimiento basadas en el producto
 */
function calculateSummaryDates(year: number, month: number, closingDay: number, dueDay: number) {
    // Fecha de cierre: día de cierre del mes especificado
    const closingDate = new Date(year, month - 1, closingDay);

    // Fecha de vencimiento: día de vencimiento del mes siguiente
    // Si el cierre es en enero, el vencimiento es en febrero, etc.
    let dueMonth = month;
    let dueYear = year;

    if (dueDay < closingDay) {
        // El vencimiento está en el mes siguiente
        dueMonth = month + 1;
        if (dueMonth > 12) {
            dueMonth = 1;
            dueYear = year + 1;
        }
    }

    const dueDate = new Date(dueYear, dueMonth - 1, dueDay);

    return { closingDate, dueDate };
}

/**
 * Genera o actualiza el resumen para un producto en un mes específico
 */
export async function generateSummary(productId: string, year: number, month: number): Promise<{ success: boolean; error?: string; summary?: any; hasTransactions?: boolean }> {
    try {
        const user = await getDemoUser();

        // Obtener el producto
        const product = await prisma.financialProduct.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new Error('Producto no encontrado');
        }

        // Validar que sea tarjeta de crédito o préstamo
        if (product.type !== ProductType.CREDIT_CARD && product.type !== ProductType.LOAN) {
            throw new Error('Los resúmenes solo están disponibles para tarjetas de crédito y préstamos');
        }

        // Validar que tenga días de cierre y vencimiento
        if (!product.closingDay || !product.dueDay) {
            throw new Error('El producto debe tener configurados los días de cierre y vencimiento');
        }

        const { closingDate, dueDate } = calculateSummaryDates(year, month, product.closingDay, product.dueDay);
        const now = new Date();
        const isClosed = now >= closingDate;

        // Calcular período de transacciones a incluir
        // Para tarjetas de crédito: incluimos transacciones cuya fecha cae en el período del resumen
        // El período va desde el cierre del mes anterior hasta el cierre de este mes
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const { closingDate: prevClosingDate } = calculateSummaryDates(prevYear, prevMonth, product.closingDay, product.dueDay);

        // Obtener transacciones del período
        // IMPORTANTE: Buscamos transacciones cuya FECHA esté en el rango
        // Esto incluye cuotas futuras que vencen en este período
        const transactions = await prisma.transaction.findMany({
            where: {
                fromProductId: productId,
                date: {
                    gt: prevClosingDate,
                    lte: closingDate,
                },
            },
        });

        console.log(`[Summary ${year}/${month}] Período: ${prevClosingDate.toISOString()} - ${closingDate.toISOString()}`);
        console.log(`[Summary ${year}/${month}] Transacciones encontradas: ${transactions.length}`);
        console.log(`[Summary ${year}/${month}] Transacciones:`, transactions.map(t => ({
            date: t.date,
            description: t.description,
            amount: Number(t.amount)
        })));

        // Calcular total a pagar
        const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        console.log(`[Summary ${year}/${month}] Total: $${totalAmount}`);

        // Si no hay monto a pagar, no crear resumen
        if (totalAmount === 0) {
            console.log(`[Summary ${year}/${month}] ⏭️  Saltando resumen con total $0`);
            return { success: true, hasTransactions: false };
        }

        // Crear o actualizar resumen
        const summary = await prisma.creditCardSummary.upsert({
            where: {
                productId_year_month: {
                    productId,
                    year,
                    month,
                },
            },
            update: {
                totalAmount,
                isClosed,
                closingDate,
                dueDate,
            },
            create: {
                productId,
                year,
                month,
                closingDate,
                dueDate,
                totalAmount,
                isClosed,
                userId: user.id,
            },
        });

        try {
            revalidatePath('/summaries');
        } catch (e) {
            // revalidatePath fails outside Next.js context, ignore in tests
        }

        return { success: true, summary, hasTransactions: transactions.length > 0 };
    } catch (error) {
        console.error('Error generating summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Genera todos los resúmenes históricos y futuros basados en transacciones
 */
export async function generateAllSummaries(productId: string): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
        // Primero, obtener todas las transacciones del producto para saber el rango de fechas
        const allTransactions = await prisma.transaction.findMany({
            where: { fromProductId: productId },
            orderBy: { date: 'asc' },
        });

        if (allTransactions.length === 0) {
            return { success: true, count: 0 };
        }

        // Obtener la fecha más antigua y más reciente
        const oldestDate = new Date(allTransactions[0].date);
        const newestDate = new Date(allTransactions[allTransactions.length - 1].date);

        console.log(`📅 Rango de transacciones: ${oldestDate.toISOString()} - ${newestDate.toISOString()}`);

        // Calcular desde qué mes hasta qué mes necesitamos generar resúmenes
        const startYear = oldestDate.getFullYear();
        const startMonth = oldestDate.getMonth() + 1; // getMonth() retorna 0-11
        let endYear = newestDate.getFullYear();
        let endMonth = newestDate.getMonth() + 1;

        // IMPORTANTE: Agregar un mes extra al final para capturar transacciones
        // que caen después del día de cierre del último mes
        // (esas transacciones van al resumen del mes siguiente)
        endMonth++;
        if (endMonth > 12) {
            endMonth = 1;
            endYear++;
        }

        let currentYear = startYear;
        let currentMonth = startMonth;
        let summariesCreated = 0;

        console.log(`🔄 Generando resúmenes desde ${startMonth}/${startYear} hasta ${endMonth}/${endYear}`);

        // Generar resúmenes mes a mes
        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            const result = await generateSummary(productId, currentYear, currentMonth);

            if (!result.success) {
                console.error(`❌ Error en ${currentMonth}/${currentYear}:`, result.error);
            } else if (result.hasTransactions) {
                summariesCreated++;
                console.log(`✅ Resumen ${currentMonth}/${currentYear} creado`);
            }

            // Avanzar al siguiente mes
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }

            // Límite de seguridad: no más de 36 meses
            if ((currentYear - startYear) * 12 + (currentMonth - startMonth) > 36) {
                console.log('⚠️  Límite de 36 meses alcanzado');
                break;
            }
        }

        try {
            revalidatePath('/summaries');
        } catch (e) {
            // Ignore revalidate errors in non-Next.js context
        }

        console.log(`✨ Total de resúmenes generados: ${summariesCreated}`);

        return {
            success: true,
            count: summariesCreated
        };
    } catch (error) {
        console.error('Error generating all summaries:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Obtiene todos los resúmenes de un producto
 */
export async function getProductSummaries(productId: string) {
    try {
        const summaries = await prisma.creditCardSummary.findMany({
            where: {
                productId,
                totalAmount: { gt: 0 } // Solo resúmenes con monto mayor a 0
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
            ],
            include: {
                product: {
                    select: {
                        name: true,
                        type: true,
                        currency: true,
                    },
                },
            },
        });

        // Convertir Decimal a number para evitar errores de serialización
        const summariesWithNumbers = summaries.map(s => ({
            ...s,
            totalAmount: Number(s.totalAmount),
        }));

        return { success: true, summaries: summariesWithNumbers };
    } catch (error) {
        console.error('Error fetching summaries:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Obtiene un resumen específico con sus transacciones
 */
export async function getSummaryDetail(productId: string, year: number, month: number) {
    try {
        const product = await prisma.financialProduct.findUnique({
            where: { id: productId },
        });

        if (!product || !product.closingDay || !product.dueDay) {
            throw new Error('Producto no encontrado o mal configurado');
        }

        // Calcular fechas del período
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const { closingDate: prevClosingDate } = calculateSummaryDates(prevYear, prevMonth, product.closingDay, product.dueDay);
        const { closingDate, dueDate } = calculateSummaryDates(year, month, product.closingDay, product.dueDay);

        // Obtener resumen
        const summary = await prisma.creditCardSummary.findUnique({
            where: {
                productId_year_month: {
                    productId,
                    year,
                    month,
                },
            },
            include: {
                product: true,
            },
        });

        // Obtener transacciones del período
        const transactions = await prisma.transaction.findMany({
            where: {
                fromProductId: productId,
                date: {
                    gt: prevClosingDate,
                    lte: closingDate,
                },
            },
            orderBy: {
                date: 'asc',
            },
        });

        // Convertir Decimals a numbers
        const transactionsWithNumbers = transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
        }));

        return {
            success: true,
            summary: summary ? {
                ...summary,
                totalAmount: Number(summary.totalAmount),
                product: summary.product ? {
                    ...summary.product,
                    balance: Number(summary.product.balance),
                    limit: summary.product.limit ? Number(summary.product.limit) : null,
                } : undefined,
            } : null,
            transactions: transactionsWithNumbers,
            periodStart: prevClosingDate,
            periodEnd: closingDate,
            dueDate,
        };
    } catch (error) {
        console.error('Error fetching summary detail:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
