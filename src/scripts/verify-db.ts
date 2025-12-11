import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function serializeDecimals<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj, (_, value) => {
        if (
            value &&
            typeof value === 'object' &&
            (
                value.constructor?.name === 'Decimal' ||
                ('toFixed' in value && 'plus' in value) ||
                ('d' in value && 'e' in value && 's' in value)
            )
        ) {
            return Number(value);
        }
        return value;
    }));
}

async function verify() {
    const serviceCount = await prisma.service.count();
    const billCount = await prisma.serviceBill.count();
    console.log(`Services: ${serviceCount}`);
    console.log(`Bills: ${billCount}`);

    if (serviceCount > 0) {
        const service = await prisma.service.findFirst();
        console.log('Sample Service:', service);
        console.log('Serialized:', serializeDecimals(service));

        // Check Decimal prototype
        if (service?.defaultAmount) {
            const val: any = service.defaultAmount;
            console.log('Constructor Name:', val.constructor?.name);
            console.log('Keys:', Object.keys(val));
            console.log('Has toFixed:', 'toFixed' in val);
        }
    }
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
