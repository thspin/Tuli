import { PrismaClient, BillStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function testOverdueBills() {
    console.log('Testing Overdue Bills Query...\n');

    const userEmail = 'demo@financetracker.com';
    const user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
        console.log('User not found');
        return;
    }

    // Simulating viewing December 2025
    const viewMonth = 12;
    const viewYear = 2025;

    console.log(`Viewing: ${viewMonth}/${viewYear}\n`);

    // Query for current month bills
    const currentBills = await prisma.serviceBill.findMany({
        where: {
            userId: user.id,
            month: viewMonth,
            year: viewYear
        },
        include: { service: true }
    });

    console.log(`Current Month Bills (${viewMonth}/${viewYear}):`, currentBills.length);
    currentBills.forEach(b => {
        console.log(`  - ${b.service.name}: ${b.status}, Due: ${b.dueDate.toISOString().split('T')[0]}, Period: ${b.month}/${b.year}`);
    });

    // Query for overdue bills
    const overdueBills = await prisma.serviceBill.findMany({
        where: {
            userId: user.id,
            status: BillStatus.PENDING,
            OR: [
                { year: { lt: viewYear } },
                { year: viewYear, month: { lt: viewMonth } }
            ]
        },
        include: { service: true },
        orderBy: { dueDate: 'asc' }
    });

    console.log(`\nOverdue Bills (before ${viewMonth}/${viewYear}):`, overdueBills.length);
    overdueBills.forEach(b => {
        console.log(`  - ${b.service.name}: ${b.status}, Due: ${b.dueDate.toISOString().split('T')[0]}, Period: ${b.month}/${b.year}`);
    });

    // Show ALL pending bills
    console.log('\n--- ALL PENDING BILLS ---');
    const allPending = await prisma.serviceBill.findMany({
        where: {
            userId: user.id,
            status: BillStatus.PENDING
        },
        include: { service: true },
        orderBy: { dueDate: 'asc' }
    });

    allPending.forEach(b => {
        console.log(`  - ${b.service.name}: Due ${b.dueDate.toISOString().split('T')[0]}, Period: ${b.month}/${b.year}`);
    });
}

testOverdueBills()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
