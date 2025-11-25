import { prisma } from "@/lib/prisma";
import SummariesView from "./SummariesView";
import { ProductType } from "@prisma/client";

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

async function getSummariesPageData() {
    const user = await getDemoUser();

    // Obtener solo productos que sean tarjetas de crédito o préstamos
    // Y que tengan transacciones pendientes
    const products = await prisma.financialProduct.findMany({
        where: {
            userId: user.id,
            type: {
                in: [ProductType.CREDIT_CARD, ProductType.LOAN]
            },
            // Solo productos con días de cierre y vencimiento configurados
            closingDay: { not: null },
            dueDay: { not: null },
            // Solo productos que tienen transacciones
            transactionsOrigin: {
                some: {}
            }
        },
        orderBy: {
            name: 'asc',
        },
    });

    return {
        products: products.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type as 'CREDIT_CARD' | 'LOAN',
            currency: p.currency,
            closingDay: p.closingDay,
            dueDay: p.dueDay,
        }))
    };
}

export default async function SummariesPage() {
    const data = await getSummariesPageData();

    return <SummariesView products={data.products} />;
}
