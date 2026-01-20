'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { getAllLatestExchangeRates } from "@/src/utils/exchangeRate";
import { Currency } from "@prisma/client";

export interface AnalyticsData {
    // Balances
    totalArs: number;
    totalUsd: number;
    totalDebtArs: number;
    debtProjection: { month: string; year: number; amount: number }[];

    // Transactions summary
    totalTransactions: number;
    totalExpenses: number;
    totalIncome: number;

    // By category
    expensesByCategory: { name: string; icon: string; total: number; count: number }[];

    // By card
    expensesByCard: { name: string; provider: string; total: number; count: number }[];

    // Monthly breakdown
    monthlyExpenses: { month: string; year: number; total: number; count: number }[];

    // Cashflow for chart (Dec 2025 - Dec 2026)
    monthlyCashflow: { label: string; income: number; expense: number; month: number; year: number }[];

    // Top merchants
    topMerchants: { name: string; total: number; count: number }[];

    // Installments overview
    installmentsOverview: {
        totalActiveInstallments: number;
        monthlyInstallmentAmount: number;
        installmentGroups: { description: string; remaining: number; monthlyAmount: number; totalAmount: number }[];
    };

    // Credit card utilization
    creditCardUsage: {
        cardName: string;
        currentDebt: number;
        totalSpent: number;
        transactionCount: number;
    }[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
    const user = await requireUser();
    const BA_TZ = 'America/Argentina/Buenos_Aires';

    // Get all products
    const products = await prisma.financialProduct.findMany({
        where: { userId: user.id },
        include: {
            institution: true,
            transactionsOrigin: true
        }
    });

    // Calculate totals
    const totalArs = products
        .filter(p => p.currency === 'ARS' && p.type !== 'CREDIT_CARD' && p.type !== 'LOAN')
        .reduce((sum, p) => sum + Number(p.balance), 0);

    const totalUsd = products
        .filter(p => p.currency === 'USD' && p.type !== 'CREDIT_CARD' && p.type !== 'LOAN')
        .reduce((sum, p) => sum + Number(p.balance), 0);

    const totalDebtArs = products
        .filter(p => p.type === 'CREDIT_CARD' && p.currency === 'ARS')
        .reduce((sum, p) => sum + Math.abs(Number(p.balance)), 0);

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        include: {
            category: true,
            fromProduct: {
                include: { institution: true }
            },
            toProduct: {
                include: { institution: true }
            },
            // @ts-ignore
            summaryItems: {
                include: {
                    summary: true
                }
            }
        },
        orderBy: { date: 'desc' }
    }) as any[];

    // Get all exchange rates for normalization
    const rates = await getAllLatestExchangeRates();

    const normalizeToArs = (amount: number, fromCurrency: string): number => {
        if (fromCurrency === 'ARS') return amount;

        // If it's a crypto currency, first convert to USD
        const isCrypto = ['BTC', 'USDT', 'USDC'].includes(fromCurrency);
        let amountInUsd = amount;

        if (isCrypto) {
            const cryptoToUsdRate = rates[`${fromCurrency}_USD`];
            if (cryptoToUsdRate) {
                amountInUsd = amount * cryptoToUsdRate;
            } else {
                return amount; // Fallback to raw amount if no rate
            }
        }

        // Convert USD (or original currency if not crypto) to ARS
        const usdToArsRate = rates['USD_ARS'];
        if (usdToArsRate) {
            return amountInUsd * usdToArsRate;
        }

        return amountInUsd;
    };

    // Helpers para identificar liquidez vs deuda
    const isLiquidity = (product: any) =>
        product && product.type !== 'CREDIT_CARD' && product.type !== 'LOAN';

    // Definición de Ingresos y Egresos REALIZADOS (Flujo de Caja)
    // - Ingreso: Transaction.type INCOME a un producto de liquidez, o TRANSFER de deuda a liquidez.
    // - Egreso: Transaction.type EXPENSE desde un producto de liquidez, o TRANSFER de liquidez a deuda (pago).

    interface RealizedTx extends Array<any> { [key: number]: any }

    const realizedTransactions = transactions.filter(t => {
        if (t.type === 'INCOME') {
            return t.toProduct ? isLiquidity(t.toProduct) : isLiquidity(t.fromProduct);
        }
        if (t.type === 'EXPENSE') {
            return isLiquidity(t.fromProduct);
        }
        if (t.type === 'TRANSFER') {
            const fromLiq = isLiquidity(t.fromProduct);
            const toLiq = isLiquidity(t.toProduct);

            // Caso 1: Cruza la frontera liquidez/deuda (ej. pago de tarjeta o desembolso préstamo)
            if (fromLiq !== toLiq) return true;

            // Caso 2: Es entre dos productos de liquidez pero hay cambio de moneda (CONVERSIÓN)
            if (fromLiq && toLiq) {
                const sameCurrency = t.fromProduct?.currency === t.toProduct?.currency;
                return !sameCurrency;
            }
        }
        return false;
    });

    const totalTransactions = transactions.length;

    let totalExpenses = 0;
    let totalIncome = 0;

    realizedTransactions.forEach(t => {
        const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');

        if (t.type === 'INCOME') {
            totalIncome += amountArs;
        } else if (t.type === 'EXPENSE') {
            totalExpenses += amountArs;
        } else if (t.type === 'TRANSFER') {
            const fromLiq = isLiquidity(t.fromProduct);
            const toLiq = isLiquidity(t.toProduct);

            // Si el destino es liquidez y el origen no lo era, es ingreso
            if (toLiq && !fromLiq) {
                totalIncome += amountArs;
            }
            // Si el origen es liquidez y el destino no lo era, es egreso
            else if (fromLiq && !toLiq) {
                totalExpenses += amountArs;
            }
            // Si ambos son liquidez pero hay cambio de moneda (Conversión)
            else if (fromLiq && toLiq && t.fromProduct?.currency !== t.toProduct?.currency) {
                // En una conversión, el monto suele estar en la moneda de ORIGEN.
                // Sin embargo, para que aparezca como "Ingreso" en Pesos cuando compras pesos con USD:
                // Si la moneda de destino es ARS, lo contamos como ingreso de pesos.
                if (t.toProduct?.currency === 'ARS') {
                    // Usamos el monto ya normalizado a ARS
                    totalIncome += amountArs;
                } else {
                    // Si el destino no es ARS (ej. compraste USD con ARS), es un egreso de pesos (realizado)
                    totalExpenses += amountArs;
                }
            }
        }
    });

    // Helper to get BA month/year for any date (returns 1-12 for month)
    const getBAInfo = (date: Date) => {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: BA_TZ,
            year: 'numeric',
            month: 'numeric'
        }).formatToParts(date);
        return {
            y: parseInt(parts.find(p => p.type === 'year')!.value),
            m: parseInt(parts.find(p => p.type === 'month')!.value)
        };
    };

    // Calculate Cashflow (Dec 2025 - Dec 2026)
    const monthlyCashflow: { label: string; income: number; expense: number; month: number; year: number }[] = [];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Dec 2025
    monthlyCashflow.push({ label: 'Dic 25', income: 0, expense: 0, month: 12, year: 2025 });
    // Jan 2026 to Dec 2026
    for (let m = 1; m <= 12; m++) {
        monthlyCashflow.push({
            label: `${months[m - 1]} 26`,
            income: 0,
            expense: 0,
            month: m,
            year: 2026
        });
    }

    realizedTransactions.forEach(t => {
        const { y, m } = getBAInfo(new Date(t.date));
        const monthData = monthlyCashflow.find(cf => cf.year === y && cf.month === m);

        if (monthData) {
            const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');

            if (t.type === 'INCOME') {
                monthData.income += amountArs;
            } else if (t.type === 'EXPENSE') {
                monthData.expense += amountArs;
            } else if (t.type === 'TRANSFER') {
                const fromLiq = isLiquidity(t.fromProduct);
                const toLiq = isLiquidity(t.toProduct);

                if (toLiq && !fromLiq) {
                    monthData.income += amountArs;
                } else if (fromLiq && !toLiq) {
                    monthData.expense += amountArs;
                }
                // Manejo de conversiones en el gráfico
                else if (fromLiq && toLiq && t.fromProduct?.currency !== t.toProduct?.currency) {
                    if (t.toProduct?.currency === 'ARS') {
                        monthData.income += amountArs;
                    } else {
                        monthData.expense += amountArs;
                    }
                }
            }
        }
    });

    // Expenses by category - We keep accrual for breakdown but filter future installments
    // to match the user's expectation of "egresos hasta hoy"
    const now = new Date();
    const { y: curY, m: curM } = getBAInfo(now);
    const endOfCurrentMonth = new Date(curY, curM, 0, 23, 59, 59);

    const categoryMap = new Map<string, { name: string; icon: string; total: number; count: number }>();
    transactions
        .filter(t => t.type === 'EXPENSE' && new Date(t.date) <= endOfCurrentMonth)
        .forEach(t => {
            const catName = t.category?.name || 'Sin categoría';
            const catIcon = t.category?.icon || '📌';
            const existing = categoryMap.get(catName) || { name: catName, icon: catIcon, total: 0, count: 0 };

            const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');
            existing.total += amountArs;
            existing.count += 1;
            categoryMap.set(catName, existing);
        });
    const expensesByCategory = Array.from(categoryMap.values())
        .sort((a, b) => b.total - a.total);

    // Expenses by credit card - Filter future ones
    const cardMap = new Map<string, { name: string; provider: string; total: number; count: number }>();
    transactions
        .filter(t => t.type === 'EXPENSE' && t.fromProduct?.type === 'CREDIT_CARD' && new Date(t.date) <= endOfCurrentMonth)
        .forEach(t => {
            const cardName = t.fromProduct?.name || 'Desconocida';
            const provider = t.fromProduct?.provider || 'OTHER';
            const existing = cardMap.get(cardName) || { name: cardName, provider, total: 0, count: 0 };

            const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');
            existing.total += amountArs;
            existing.count += 1;
            cardMap.set(cardName, existing);
        });
    const expensesByCard = Array.from(cardMap.values())
        .sort((a, b) => b.total - a.total);

    // Monthly breakdown - Realized expenses
    const monthMap = new Map<string, { month: string; year: number; total: number; count: number }>();
    realizedTransactions
        .forEach(t => {
            const date = new Date(t.date);
            const monthName = date.toLocaleString('es-AR', { month: 'long' });
            const year = date.getFullYear();
            const key = `${year}-${date.getMonth()}`;
            const existing = monthMap.get(key) || { month: monthName, year, total: 0, count: 0 };

            // In monthly breakdown, realized income shouldn't count, only realized expenses
            const isExpense = t.type === 'EXPENSE' || (t.type === 'TRANSFER' && !isLiquidity(t.toProduct));
            // También incluimos conversiones donde el destino no es ARS como "gasto" (salida de capital local)
            const isArsOutConversion = t.type === 'TRANSFER' && isLiquidity(t.fromProduct) && isLiquidity(t.toProduct) && t.fromProduct?.currency === 'ARS' && t.toProduct?.currency !== 'ARS';

            if (isExpense || isArsOutConversion) {
                const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');
                existing.total += amountArs;
                existing.count += 1;
                monthMap.set(key, existing);
            }
        });
    const monthlyExpenses = Array.from(monthMap.values())
        .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            return months.indexOf(b.month) - months.indexOf(a.month);
        });

    // Top merchants - Keep accrual for history but filter future
    const merchantMap = new Map<string, { name: string; total: number; count: number }>();
    transactions
        .filter(t => t.type === 'EXPENSE' && new Date(t.date) <= endOfCurrentMonth)
        .forEach(t => {
            // Clean up description to group similar merchants
            let name = t.description
                .replace(/\d+/g, '') // Remove numbers
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim()
                .toUpperCase();

            // Group UBER variations
            if (name.includes('UBER')) name = 'UBER';
            if (name.includes('PEDIDOS YA')) name = 'PEDIDOS YA';
            if (name.includes('BIND PAGOS')) name = 'BIND PAGOS';

            const existing = merchantMap.get(name) || { name, total: 0, count: 0 };
            const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');
            existing.total += amountArs;
            existing.count += 1;
            merchantMap.set(name, existing);
        });
    const topMerchants = Array.from(merchantMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    // Installments overview - Fixed with explicit timezone handling
    const nowForBA = new Date();

    // Get current BA month/year (1-12)
    const nowPartsBA = new Intl.DateTimeFormat('en-US', {
        timeZone: BA_TZ,
        year: 'numeric',
        month: 'numeric'
    }).formatToParts(nowForBA);

    const curYearBA = parseInt(nowPartsBA.find(p => p.type === 'year')!.value);
    const curMonthBA = parseInt(nowPartsBA.find(p => p.type === 'month')!.value);

    const installmentTransactions = transactions.filter(t => t.installmentId);

    // 1. Calculate Monthly Amount: Sum of all installments in the CURRENT BA month
    const monthlyInstallmentAmount = installmentTransactions
        .reduce((sum, t) => {
            const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');
            return sum + amountArs;
        }, 0);

    // 2. Identify Active Groups and calculate metrics
    const activeGroupMap = new Map<string, {
        description: string;
        monthlyAmount: number;
        totalAmount: number;
        totalCuotas: number;
        cuotasPagadasAntesDeEsteMes: number;
        hasCurrentMonth: boolean;
    }>();

    installmentTransactions.forEach(t => {
        const { y, m } = getBAInfo(new Date(t.date));
        const id = t.installmentId!;

        const isCurrent = y === curYearBA && m === curMonthBA;
        const isPast = y < curYearBA || (y === curYearBA && m < curMonthBA);

        const amountArs = normalizeToArs(Number(t.amount), t.fromProduct?.currency || 'ARS');

        const existing = activeGroupMap.get(id) || {
            description: t.description.replace(/\(Cuota.*\)/, '').trim(),
            monthlyAmount: amountArs,
            totalAmount: 0,
            totalCuotas: t.installmentTotal || 1,
            cuotasPagadasAntesDeEsteMes: 0,
            hasCurrentMonth: false
        };

        existing.totalAmount += amountArs;
        if (isPast) {
            existing.cuotasPagadasAntesDeEsteMes += 1;
        }
        if (isCurrent) {
            existing.hasCurrentMonth = true;
        }

        activeGroupMap.set(id, existing);
    });

    const installmentGroupsArray = Array.from(activeGroupMap.values())
        .map(g => ({
            description: g.description,
            remaining: g.totalCuotas - g.cuotasPagadasAntesDeEsteMes,
            monthlyAmount: g.monthlyAmount,
            totalAmount: g.totalAmount,
            isCurrentMonthActive: g.hasCurrentMonth
        }))
        .filter(g => g.remaining > 0)
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

    const totalActiveInstallments = installmentGroupsArray.length;

    // --- Debt Projection (Next 12 months) ---
    const debtProjection = [];
    const currentMonthForProj = new Date(curYearBA, curMonthBA - 1, 1);

    for (let i = 0; i < 12; i++) {
        const monthDate = new Date(currentMonthForProj);
        monthDate.setMonth(monthDate.getMonth() + i);
        const y = monthDate.getFullYear();

        let projectedAmount = 0;
        installmentGroupsArray.forEach(group => {
            // Si la cuota estaba activa este mes o empieza pronto
            // y aún quedaban cuotas (remaining es relativo al mes actual)
            if (i < group.remaining) {
                projectedAmount += group.monthlyAmount;
            }
        });

        debtProjection.push({
            month: monthDate.toLocaleString('es-AR', { month: 'short' }),
            year: y,
            amount: projectedAmount
        });
    }

    // Credit card usage
    const creditCards = products.filter(p => p.type === 'CREDIT_CARD');
    const creditCardUsage = creditCards.map(card => {
        const cardTransactions = transactions.filter(t => t.fromProductId === card.id && t.type === 'EXPENSE');
        return {
            cardName: card.name,
            currentDebt: Math.abs(Number(card.balance)),
            totalSpent: cardTransactions.reduce((sum, t) => {
                const amountArs = normalizeToArs(Number(t.amount), card.currency);
                return sum + amountArs;
            }, 0),
            transactionCount: cardTransactions.length
        };
    }).filter(c => c.transactionCount > 0)
        .sort((a, b) => b.totalSpent - a.totalSpent);

    return {
        totalArs,
        totalUsd,
        totalDebtArs,
        debtProjection,
        totalTransactions,
        totalExpenses,
        totalIncome,
        expensesByCategory,
        expensesByCard,
        monthlyExpenses,
        monthlyCashflow,
        topMerchants,
        installmentsOverview: {
            totalActiveInstallments,
            monthlyInstallmentAmount,
            installmentGroups: installmentGroupsArray.slice(0, 5)
        },
        creditCardUsage
    };
}
