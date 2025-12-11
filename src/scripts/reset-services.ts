import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetServices() {
    console.log('Resetting services...');
    // Demo user
    const userEmail = 'demo@financetracker.com';
    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        console.log('Demo user not found.');
        return;
    }

    // Delete all Services (Cascade will delete ServiceBills and PaymentRules)
    const { count } = await prisma.service.deleteMany({
        where: { userId: user.id }
    });

    console.log(`Deleted ${count} services.`);
}

resetServices()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
