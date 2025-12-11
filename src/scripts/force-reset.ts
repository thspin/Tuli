import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceReset() {
    console.log('Force resetting...');
    try {
        const user = await prisma.user.findFirst({ where: { email: 'demo@financetracker.com' } }); // Ensure we get the user
        if (user) {
            const deletedBills = await prisma.serviceBill.deleteMany({ where: { userId: user.id } });
            console.log(`Deleted ${deletedBills.count} bills.`);

            const deletedRules = await prisma.servicePaymentRule.deleteMany({ where: { service: { userId: user.id } } });
            console.log(`Deleted ${deletedRules.count} rules.`);

            // Delete services last (or cascade)
            const deletedServices = await prisma.service.deleteMany({ where: { userId: user.id } });
            console.log(`Deleted ${deletedServices.count} services.`);
        }
    } catch (e) {
        console.error('Error during reset:', e);
    }
    console.log('Done.');
}

forceReset()
    .finally(() => prisma.$disconnect());
