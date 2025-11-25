
import { prisma } from './lib/prisma';

async function verify() {
    const transactions = await prisma.transaction.findMany({
        take: 3,
        orderBy: {
            id: 'desc'
        },
        include: {
            fromProduct: true
        }
    });

    console.log('Last 3 transactions:');
    transactions.reverse().forEach(t => {
        console.log({
            date: t.date,
            description: t.description,
            amount: t.amount,
            installmentNumber: t.installmentNumber,
            installmentTotal: t.installmentTotal,
            installmentId: t.installmentId,
            productName: t.fromProduct.name,
            productBalance: t.fromProduct.balance
        });
    });
}

verify()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
