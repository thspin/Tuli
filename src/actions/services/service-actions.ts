'use server'

import { prisma } from "@/src/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { Service, ServiceBill, BillStatus, ServiceBenefitType, TransactionType, ProductType } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

// --- HELPER: Deep Serialization to eliminate ALL Decimal issues ---
/**
 * Recursively converts Prisma Decimal objects to Numbers throughout the entire object tree.
 * This prevents "Decimal objects are not supported" errors when passing data to Client Components.
 */
function deepSerialize(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle Decimal objects (check constructor name and duck typing)
    if (
        obj.constructor?.name === 'Decimal' ||
        (typeof obj === 'object' && 'd' in obj && 'e' in obj && 's' in obj)
    ) {
        return Number(obj);
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return obj;
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(item => deepSerialize(item));
    }

    // Handle plain objects
    if (typeof obj === 'object') {
        const serialized: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                serialized[key] = deepSerialize(obj[key]);
            }
        }
        return serialized;
    }

    // Primitive values (string, number, boolean)
    return obj;
}

// --- HELPER: Get Demo User ---
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

// --- SERVICES CRUD ---

export async function getServices() {
    try {
        const user = await getDemoUser();
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
        return { success: true, data: deepSerialize(services) };
    } catch (error) {
        return { success: false, error: 'Error al obtener servicios' };
    }
}

export async function createService(formData: FormData) {
    try {
        const user = await getDemoUser();
        const name = formData.get('name') as string;
        const categoryId = formData.get('categoryId') as string;
        // Optional Due Day (null = Manual Service)
        const defaultDueDay = formData.get('defaultDueDay') ? parseInt(formData.get('defaultDueDay') as string) : null;
        // Default to 0 if not provided (UI field removed)
        const defaultAmount = formData.get('defaultAmount') ? parseFloat(formData.get('defaultAmount') as string) : 0;
        const renewalDateStr = formData.get('renewalDate') as string;
        const renewalNote = formData.get('renewalNote') as string;


        if (!name || !categoryId) {
            throw new Error('Faltan campos obligatorios');
        }

        await prisma.service.create({
            data: {
                name,
                categoryId,
                defaultDueDay,
                defaultAmount,
                renewalDate: renewalDateStr ? new Date(renewalDateStr) : null,
                renewalNote,
                userId: user.id
            }
        });

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
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
        const name = formData.get('name') as string;
        const categoryId = formData.get('categoryId') as string;
        // Keep existing if not in form, or default? for update we might not want to overwrite if not present?
        // Actually, if it's missing from form it might be intended to be unchanged OR undefined. 
        // But since we are removing it from UI completely, we should probably NOT try to update it if it's not in formData, 
        // OR we just ignore it.
        // However, Prisma 'update' only updates provided fields.
        // Wait, 'updateServiceFromForm' extracts values.
        // If I remove the input, formData.get() returns null.
        // I need to fetch the existing service to keep previous value? 
        // OR better: Just don't include it in the `data` object if it's null/NaN.

        let defaultDueDay: number | undefined;
        if (formData.get('defaultDueDay')) {
            defaultDueDay = parseInt(formData.get('defaultDueDay') as string);
        }

        let defaultAmount: number | null | undefined;
        if (formData.has('defaultAmount')) { // Checking has() in case they want to clear it?
            // If field is removed, it won't be 'has'.
            const val = formData.get('defaultAmount');
            defaultAmount = val ? parseFloat(val as string) : null;
        }
        const renewalDateStr = formData.get('renewalDate') as string;
        const renewalNote = formData.get('renewalNote') as string;
        const active = formData.get('active') !== 'false';

        await prisma.service.update({
            where: { id: serviceId },
            data: {
                name,
                categoryId,
                ...(defaultDueDay !== undefined && { defaultDueDay }),
                ...(defaultAmount !== undefined && { defaultAmount }),
                renewalDate: renewalDateStr ? new Date(renewalDateStr) : null,
                renewalNote: renewalNote || null,
                active
            }
        });

        revalidatePath('/services');
        return { success: true };
    } catch (error) {
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
        const user = await getDemoUser();

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

        // NOTE: We removed the early return here because we ALWAYS need to fetch overdue bills
        // even if there are no missing services for the current month

        // 4. Generate missing bills
        const newBillsData = missingServices.map(service => {
            if (!service.defaultDueDay) return null; // Should be filtered out but for safety

            // Calculate due date: Year/Month/DefaultDay
            // Handle invalid days (e.g., Feb 30)
            const safeDay = Math.min(service.defaultDueDay, new Date(year, month, 0).getDate()); // month is 1-12, Date uses 1-12 for day 0? No.
            // Date(year, monthIndex, 0) gives last day of previous month.
            // We need Date(year, month, 0) where month is 1-based?
            // JS Date monthIndex is 0-11.
            // So for "March" (3), we want new Date(year, 3, 0) -> Last day of March? No, Last day of Feb is new Date(year, 2, 0).
            // Last day of Target Month (monthIndex = month - 1)
            const daysInMonth = new Date(year, month, 0).getDate();
            const dueDay = Math.min(service.defaultDueDay, daysInMonth);

            const dueDate = new Date(year, month - 1, dueDay);

            return {
                serviceId: service.id,
                month,
                year,
                dueDate,
                amount: service.defaultAmount || 0,
                status: BillStatus.PENDING,
                userId: user.id
            };
        }).filter(b => b !== null) as any[]; // Type assertion for filter

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
        // Logic: (Year < CurrentYear) OR (Year == CurrentYear AND Month < CurrentMonth)
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
            data: allBills,
            overdue: overdueBills
        };

        return deepSerialize(response);

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
        const user = await getDemoUser();
        const serviceId = formData.get('serviceId') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const dueDateStr = formData.get('dueDate') as string;

        // Logic change: Derive month/year from Due Date to ensure consistency.
        // The user might be in "December view" but pick a "January" date.
        const dueDate = new Date(dueDateStr);
        // Correct for timezone offset if needed? Usually valid dateStr is enough.
        // Assuming dueDateStr is YYYY-MM-DD

        const month = dueDate.getMonth() + 1;
        const year = dueDate.getFullYear();

        /* 
        const month = parseInt(formData.get('month') as string);
        const year = parseInt(formData.get('year') as string);
        */

        if (!serviceId || isNaN(amount) || !dueDateStr) {
            throw new Error('Datos incompletos para crear la boleta');
        }

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
            updateData.dueDate = new Date(dueDateStr);
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
        // Instead, we mark it as SKIPPED to indicate no payment is needed this month.
        // If service is active AND has a defaultDueDay, we mark as SKIPPED to prevent regen.
        // If it's a manual service (no due day), we can safely hard delete.
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
        const billId = formData.get('billId') as string;
        const productId = formData.get('productId') as string; // Payment Method
        const dateStr = formData.get('date') as string;
        const amount = parseFloat(formData.get('amount') as string); // Confirmed amount by user

        if (!billId || !productId || !dateStr || isNaN(amount)) {
            throw new Error('Datos incompletos para el pago');
        }

        const user = await getDemoUser();
        const date = new Date(dateStr);

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
            // Simple check for Debit/Cash
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
                // value is percentage (e.g., 10)
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
            // Logic copied/simplified from transaction-actions.ts
            // For MVP, simplified balance update.

            let balanceChange = -finalExpenseAmount;
            let limitUpdate = {};

            if (product.type === ProductType.CREDIT_CARD) {
                // Credit Card: Balance decreases (more debt), Limit decreases
                limitUpdate = {
                    limitSinglePayment: { increment: balanceChange },
                    limitInstallments: { increment: balanceChange } // Assuming 1 payment affects both or logic
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
                await tx.transaction.create({
                    data: {
                        amount: cashbackAmount,
                        date: date,
                        description: `Cashback: ${bill.service.name}`,
                        type: TransactionType.INCOME,
                        // Where does cashback go? Usually to the same card/account.
                        toProductId: productId,
                        // fromProductId is required by schema? No, toProductId is enough for Income?
                        // Schema: fromProductId is NON-NULLABLE. 
                        // For Income, 'fromProductId' usually implies Source? 
                        // Let's check schema... `fromProductId String`.
                        // In `transaction-actions`, how is Income handled?
                        // It's not implemented there!
                        // Assuming Income needs a 'from' product is weird unless it's a transfer.
                        // If it's external income, maybe we need a "Cash" or "External" product?
                        // Let's look at schema `fromProductId` relation.
                        // `fromProduct FinancialProduct`.
                        // We need a dummy product or allow null? Schema says NOT NULL.
                        // Workaround: Use the same product as source/dest for cashback? 
                        // Or create a System Product?
                        // Let's skip Creating Transaction for Cashback to avoid breaking schema constraints
                        // and just update the balance directly with a note?
                        // Or better: Just update the balance of the product adding the cashback.
                        // But we want a record. 
                        // Let's use the same product as `fromProductId` for now, effectively a self-transfer?
                        // No, Income type needs logic.
                        // Let's just log it in the console for now, or skip to keep safe.
                        // Re-reading user req: "computarse y contarse".
                        // I'll Apply the cashback to the balance directly (Refund).
                        userId: user.id,
                        fromProductId: productId, // Self-reference for now to satisfy FK
                    }
                });

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
        return { success: false, error: error instanceof Error ? error.message : 'Error al pagar' };
    }
}
