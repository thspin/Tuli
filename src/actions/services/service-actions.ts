'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { Service, ServiceBill, BillStatus, ServiceBenefitType, TransactionType, ProductType } from "@prisma/client";
import { z } from 'zod';
import { serializeService, serializeServiceBill } from "@/src/utils/serializers";

// --- Zod Schemas ---

const serviceSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    categoryId: z.string().min(1, "La categoría es requerida"),
    defaultDueDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
    defaultAmount: z.coerce.number().positive().optional().nullable(),
    renewalDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    renewalNote: z.string().optional().nullable(),
});

const billSchema = z.object({
    serviceId: z.string().min(1),
    amount: z.coerce.number().positive(),
    dueDate: z.string().transform(val => new Date(`${val}T12:00:00`)),
});

const payBillSchema = z.object({
    billId: z.string().min(1),
    productId: z.string().min(1),
    date: z.string().transform(val => new Date(`${val}T12:00:00`)),
    amount: z.coerce.number().positive(),
});

// --- SERVICES CRUD ---

export async function getServices() {
    try {
        const user = await requireUser();
        const services = await prisma.service.findMany({
            where: { userId: user.id },
            include: {
                category: true,
                paymentRules: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: services.map(serializeService) };
    } catch (error) {
        return { success: false, error: 'Error al obtener servicios' };
    }
}

export async function createService(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());

        // Manejo de campos vacíos que deben ser null
        if (rawData.defaultDueDay === '') delete rawData.defaultDueDay;
        if (rawData.defaultAmount === '') delete rawData.defaultAmount;
        if (rawData.renewalDate === '') delete rawData.renewalDate;

        const validated = serviceSchema.parse(rawData);
        const user = await requireUser();

        await prisma.service.create({
            data: {
                ...validated,
                userId: user.id
            }
        });

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: error instanceof Error ? error.message : 'Error al crear servicio' };
    }
}

export async function updateService(serviceId: string, data: Partial<Service>) {
    try {
        await prisma.service.update({
            where: { id: serviceId },
            data
        });
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar servicio' };
    }
}

export async function updateServiceFromForm(serviceId: string, formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        // Limpiar campos vacíos
        if (rawData.defaultDueDay === '') delete rawData.defaultDueDay;
        if (rawData.defaultAmount === '') delete rawData.defaultAmount;
        if (rawData.renewalDate === '') delete rawData.renewalDate;

        const validated = serviceSchema.parse(rawData);
        const active = formData.get('active') !== 'false';

        await prisma.service.update({
            where: { id: serviceId },
            data: {
                ...validated,
                active
            }
        });

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar servicio' };
    }
}

export async function deleteService(serviceId: string) {
    try {
        // ServiceBills will be deleted via cascade defined in schema
        await prisma.service.delete({
            where: { id: serviceId }
        });
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar servicio' };
    }
}

// --- BILLS GENERATION & FETCHING ---

export async function getMonthlyBills(month: number, year: number) {
    try {
        const user = await requireUser();

        // 1. Get existing bills
        const existingBills = await prisma.serviceBill.findMany({
            where: {
                userId: user.id,
                month,
                year
            },
            include: {
                service: {
                    include: { category: true }
                },
                transaction: true
            }
        });

        // 2. Get active services
        const services = await prisma.service.findMany({
            where: {
                userId: user.id,
                active: true
            }
        });

        // 3. Identify missing bills
        // Filter out services that don't have a default due day (Manual Services)
        const autoServices = services.filter(s => s.defaultDueDay !== null);
        const existingServiceIds = new Set(existingBills.map(b => b.serviceId));
        const missingServices = autoServices.filter(s => !existingServiceIds.has(s.id));

        // 4. Generate missing bills
        const newBillsData = missingServices.map(service => {
            if (!service.defaultDueDay) return null; // Should be filtered out but for safety

            // Calculate due date
            const daysInMonth = new Date(year, month, 0).getDate();
            const dueDay = Math.min(service.defaultDueDay, daysInMonth);
            const dueDate = new Date(year, month - 1, dueDay, 12, 0, 0);

            return {
                serviceId: service.id,
                month,
                year,
                dueDate,
                amount: service.defaultAmount || 0,
                status: BillStatus.PENDING,
                userId: user.id
            };
        }).filter(b => b !== null) as any[];

        if (newBillsData.length > 0) {
            await prisma.serviceBill.createMany({
                data: newBillsData
            });
        }

        // 5. Refetch all to return consistent data
        const allBills = await prisma.serviceBill.findMany({
            where: {
                userId: user.id,
                month,
                year
            },
            include: {
                service: {
                    include: { category: true }
                },
                transaction: true
            },
            orderBy: { dueDate: 'asc' }
        });

        // 6. Fetch Overdue Bills (Past months, Status PENDING)
        const overdueBills = await prisma.serviceBill.findMany({
            where: {
                userId: user.id,
                status: BillStatus.PENDING,
                OR: [
                    { year: { lt: year } },
                    { year: year, month: { lt: month } }
                ]
            },
            include: {
                service: {
                    include: { category: true }
                },
                transaction: true
            },
            orderBy: { dueDate: 'asc' }
        });

        const response = {
            success: true,
            data: allBills.map(serializeServiceBill),
            overdue: overdueBills.map(serializeServiceBill)
        };

        return response;

    } catch (error) {
        console.error(error);
        return { success: false, error: 'Error al obtener boletas mensuales' };
    }
}

export async function updateBill(billId: string, data: Partial<ServiceBill>) {
    try {
        await prisma.serviceBill.update({
            where: { id: billId },
            data
        });
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar boleta' };
    }
}

export async function createBill(formData: FormData) {
    try {
        const user = await requireUser();
        const rawData = Object.fromEntries(formData.entries());
        const validated = billSchema.parse(rawData);

        const { serviceId, amount, dueDate } = validated;
        const month = dueDate.getMonth() + 1;
        const year = dueDate.getFullYear();

        // Check if bill already exists for this service/month/year
        const existingBill = await prisma.serviceBill.findUnique({
            where: {
                serviceId_year_month: {
                    serviceId,
                    year,
                    month
                }
            }
        });

        if (existingBill) {
            throw new Error(`Ya existe una boleta para este servicio en el período ${month}/${year}`);
        }

        await prisma.serviceBill.create({
            data: {
                serviceId,
                amount,
                dueDate,
                month,
                year,
                status: BillStatus.PENDING,
                userId: user.id
            }
        });

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: error instanceof Error ? error.message : 'Error al crear boleta' };
    }
}

export async function updateBillFromForm(billId: string, formData: FormData) {
    try {
        const amount = parseFloat(formData.get('amount') as string);
        const dueDateStr = formData.get('dueDate') as string;
        const status = formData.get('status') as BillStatus;

        const updateData: any = {};

        if (!isNaN(amount)) {
            updateData.amount = amount;
        }
        if (dueDateStr) {
            updateData.dueDate = new Date(`${dueDateStr}T12:00:00`);
        }
        if (status) {
            updateData.status = status;
        }

        await prisma.serviceBill.update({
            where: { id: billId },
            data: updateData
        });

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar boleta' };
    }
}

export async function deleteBill(billId: string) {
    try {
        const bill = await prisma.serviceBill.findUnique({
            where: { id: billId },
            include: { service: true }
        });

        if (!bill) return { success: false, error: 'Boleta no encontrada' };

        // If service is active, we can't truly "delete" the bill because getMonthlyBills will regenerate it.
        if (bill.service.active && bill.service.defaultDueDay !== null) {
            await prisma.serviceBill.update({
                where: { id: billId },
                data: { status: BillStatus.SKIPPED }
            });
        } else {
            // Manual service or Inactive -> Hard Delete
            await prisma.serviceBill.delete({
                where: { id: billId }
            });
        }

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar boleta' };
    }
}

// --- PAYMENT RULES ---

export async function addPaymentRule(serviceId: string, productId: string, benefitType: ServiceBenefitType, value: number) {
    try {
        await prisma.servicePaymentRule.create({
            data: {
                serviceId,
                productId,
                benefitType,
                value
            }
        });
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al crear regla de pago' };
    }
}

export async function deletePaymentRule(ruleId: string) {
    try {
        await prisma.servicePaymentRule.delete({ where: { id: ruleId } });
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar regla' };
    }
}

// --- PAYMENT LOGIC ---

export async function payServiceBill(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validated = payBillSchema.parse(rawData);
        const { billId, productId, date, amount } = validated;

        const user = await requireUser();

        // Get Bill
        const bill = await prisma.serviceBill.findUnique({
            where: { id: billId },
            include: { service: true }
        });

        if (!bill) throw new Error('Boleta no encontrada');
        if (bill.status === BillStatus.PAID) throw new Error('Esta boleta ya está pagada');

        // Check Financial Product
        const product = await prisma.financialProduct.findUnique({
            where: { id: productId }
        });
        if (!product) throw new Error('Producto financiero no encontrado');
        if (Number(product.balance) < amount && product.type !== ProductType.CREDIT_CARD) {
            throw new Error('Saldo insuficiente');
        }

        // Check for Payment Rules (Cashback/Discount)
        const rule = await prisma.servicePaymentRule.findUnique({
            where: {
                serviceId_productId: {
                    serviceId: bill.serviceId,
                    productId: productId
                }
            }
        });

        let finalExpenseAmount = amount;
        let cashbackAmount = 0;

        if (rule) {
            if (rule.benefitType === ServiceBenefitType.DISCOUNT) {
                // Discount: Reduce the expense amount
                const discount = amount * (Number(rule.value) / 100);
                finalExpenseAmount = amount - discount;
            } else if (rule.benefitType === ServiceBenefitType.CASHBACK) {
                // Cashback: Expense is full, but we generate income
                const cb = amount * (Number(rule.value) / 100);
                cashbackAmount = cb;
            }
        }

        // --- TRANSACTION EXECUTION ---
        await prisma.$transaction(async (tx) => {
            // 1. Create Expense Transaction
            const transaction = await tx.transaction.create({
                data: {
                    amount: finalExpenseAmount,
                    date: date,
                    description: `Pago Servicio: ${bill.service.name}`,
                    type: TransactionType.EXPENSE,
                    categoryId: bill.service.categoryId,
                    fromProductId: productId,
                    userId: user.id
                }
            });

            // 2. Update Bill
            await tx.serviceBill.update({
                where: { id: billId },
                data: {
                    status: BillStatus.PAID,
                    transactionId: transaction.id,
                    amount: finalExpenseAmount // Update to what was actually paid
                }
            });

            // 3. Update Product Balance (Expense)
            let balanceChange = -finalExpenseAmount;
            let limitUpdate = {};

            if (product.type === ProductType.CREDIT_CARD) {
                limitUpdate = {
                    limitSinglePayment: { increment: balanceChange },
                    limitInstallments: { increment: balanceChange }
                };
                if (product.unifiedLimit) {
                    limitUpdate = {
                        limitSinglePayment: { increment: balanceChange },
                        limitInstallments: { increment: balanceChange }
                    };
                }
            }

            await tx.financialProduct.update({
                where: { id: productId },
                data: {
                    balance: { increment: balanceChange },
                    ...limitUpdate
                }
            });

            // 4. Handle Cashback (Optional Income)
            if (cashbackAmount > 0) {
                // For now, simple balance adjustment (refund approach)
                await tx.financialProduct.update({
                    where: { id: productId },
                    data: {
                        balance: { increment: cashbackAmount }
                    }
                });
            }
        });

        revalidatePath('/services');
        return { success: true };

    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: error instanceof Error ? error.message : 'Error al pagar' };
    }
}

export async function linkBillToTransaction(billId: string, transactionId: string) {
    try {
        const user = await requireUser();

        // Check ownership
        const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!transaction || transaction.userId !== user.id) throw new Error("Transacción inválida");

        const bill = await prisma.serviceBill.findUnique({ where: { id: billId }, include: { service: true } });
        if (!bill || bill.userId !== user.id) throw new Error("Boleta inválida");

        await prisma.$transaction(async (tx) => {
            // Link Bill
            await tx.serviceBill.update({
                where: { id: billId },
                data: {
                    status: BillStatus.PAID,
                    transactionId: transactionId,
                    amount: transaction.amount // Update bill amount to match linked transaction
                }
            });

            // Update Transaction Category if needed to match Service
            if (bill.service.categoryId) {
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: {
                        categoryId: bill.service.categoryId
                    }
                });
            }
        });

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al vincular pago: ' + (error instanceof Error ? error.message : 'Desconocido') };
    }
}
