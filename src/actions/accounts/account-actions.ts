'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { InstitutionType, ProductType, Currency, TransactionType } from "@prisma/client";
import { z } from 'zod';
import { getLatestExchangeRate } from "@/src/utils/exchangeRate";
import { serializeFinancialProduct, serializeTransaction } from "@/src/utils/serializers";
import {
  validateBalance,
  validateCreditCardFields,
  validateLoanFields,
  isProductTypeAllowedForInstitution,
  isCurrencyAllowedForInstitution,
  isCurrencyAllowedForCash,
  requiresInstitution,
} from "@/src/utils/validations";

// --- Zod Schemas ---

const institutionSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.nativeEnum(InstitutionType),
  shareSummary: z.preprocess(val => val === 'true' || val === true, z.boolean()).optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.nativeEnum(ProductType),
  currency: z.nativeEnum(Currency),
  balance: z.coerce.number().default(0),
  institutionId: z.string().optional().nullable(),
  // Optional specific fields
  closingDay: z.coerce.number().optional().nullable(),
  dueDay: z.coerce.number().optional().nullable(),
  limit: z.coerce.number().optional().nullable(), // Deprecated but kept
  limitSinglePayment: z.coerce.number().optional().nullable(),
  limitInstallments: z.coerce.number().optional().nullable(),
  sharedLimit: z.preprocess(val => val === 'true' || val === true, z.boolean()).optional(),
  unifiedLimit: z.preprocess(val => val === 'true' || val === true, z.boolean()).optional(),
  linkedProductId: z.string().optional().nullable(),
  lastFourDigits: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
});

// ============================================================================
// CRUD DE INSTITUCIONES FINANCIERAS
// ============================================================================

export async function createInstitution(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validated = institutionSchema.parse(rawData);
    const { name, type, shareSummary } = validated;

    const user = await requireUser();

    // Verificar que no exista una institución con el mismo nombre
    const existing = await prisma.financialInstitution.findFirst({
      where: {
        userId: user.id,
        name,
      },
    });

    if (existing) {
      throw new Error(`Ya existe una institución con el nombre "${name}"`);
    }

    await prisma.financialInstitution.create({
      data: {
        name,
        type,
        shareSummary: shareSummary || name.toLowerCase().includes('naranja'),
        userId: user.id,
      },
    });

    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function updateInstitution(id: string, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validated = institutionSchema.parse(rawData);
    const { name, type, shareSummary } = validated;

    const user = await requireUser();

    // Verificar que no exista otra institución con el mismo nombre
    const existing = await prisma.financialInstitution.findFirst({
      where: {
        userId: user.id,
        name,
        id: { not: id },
      },
    });

    if (existing) {
      throw new Error(`Ya existe una institución con el nombre "${name}"`);
    }

    await prisma.financialInstitution.update({
      where: { id },
      data: { name, type, shareSummary: shareSummary || name.toLowerCase().includes('naranja') },
    });

    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function deleteInstitution(id: string) {
  try {
    // Verificar que no tenga productos asociados
    const products = await prisma.financialProduct.count({
      where: { institutionId: id },
    });

    if (products > 0) {
      throw new Error('No se puede eliminar una institución con productos asociados');
    }

    await prisma.financialInstitution.delete({
      where: { id },
    });

    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ============================================================================
// CRUD DE PRODUCTOS FINANCIEROS
// ============================================================================

export async function createProduct(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    // Ajustar campos vacíos a null/undefined si es necesario antes del parseo
    // Zod coerce ya maneja strings vacíos a 0 para numeros, pero para optionals strings?
    const validated = productSchema.parse(rawData);

    // Extraer variables validadas
    const {
      name, type, currency, balance, institutionId,
      closingDay, dueDay, limit, limitSinglePayment, limitInstallments,
      sharedLimit, unifiedLimit, linkedProductId, lastFourDigits, provider, expirationDate
    } = validated;

    const user = await requireUser();

    // --- Complex Business Logic Validations (kept from original) ---

    // Validar que CASH no tenga institución
    if (type === ProductType.CASH && institutionId) {
      throw new Error('El efectivo no debe tener una institución asociada');
    }

    // Validar que otros productos tengan institución
    if (requiresInstitution(type) && !institutionId) {
      throw new Error('Este tipo de producto requiere una institución');
    }

    // Validar moneda para CASH
    if (type === ProductType.CASH && !isCurrencyAllowedForCash(currency)) {
      throw new Error('Moneda no permitida para efectivo');
    }

    // Obtener institución si existe
    let institution = null;
    if (institutionId) {
      institution = await prisma.financialInstitution.findUnique({
        where: { id: institutionId },
      });

      if (!institution) {
        throw new Error('Institución no encontrada');
      }

      // Validar tipo de producto permitido para la institución
      if (!isProductTypeAllowedForInstitution(type, institution.type)) {
        throw new Error(`El tipo de producto "${type}" no es permitido para esta institución`);
      }

      // Validar moneda permitida para la institución
      if (!isCurrencyAllowedForInstitution(currency, institution.type)) {
        throw new Error(`La moneda "${currency}" no es permitida para esta institución`);
      }
    }

    // Validar balance según tipo de producto
    const balanceValidation = validateBalance(balance, type, institution?.type);
    if (!balanceValidation.valid) {
      throw new Error(balanceValidation.error);
    }

    // Validar campos de tarjeta de crédito
    if (type === ProductType.CREDIT_CARD || type === ProductType.DEBIT_CARD) {
      if (lastFourDigits && !/^\d{4}$/.test(lastFourDigits)) {
        throw new Error('Los últimos 4 dígitos deben ser 4 números');
      }
    }

    if (type === ProductType.CREDIT_CARD) {
      const creditCardValidation = validateCreditCardFields(closingDay || null, dueDay || null, limitSinglePayment || limitInstallments || null);
      if (!creditCardValidation.valid) {
        throw new Error(creditCardValidation.error);
      }
    }

    if (type === ProductType.DEBIT_CARD) {
      if (!linkedProductId) {
        throw new Error('La tarjeta de débito debe estar vinculada a una caja de ahorro');
      }

      // Validar que la cuenta vinculada exista y sea del mismo usuario e institución
      const linkedProduct = await prisma.financialProduct.findFirst({
        where: {
          id: linkedProductId,
          userId: user.id,
          institutionId: institutionId,
          type: ProductType.SAVINGS_ACCOUNT
        }
      });

      if (!linkedProduct) {
        throw new Error('La cuenta vinculada no es válida o no pertenece a la misma institución');
      }
    }

    if (type === ProductType.LOAN) {
      const loanValidation = validateLoanFields(limit || null);
      if (!loanValidation.valid) {
        throw new Error(loanValidation.error);
      }
    }

    // Verificar que no exista un producto con el mismo nombre y moneda en la misma institución
    const existing = await prisma.financialProduct.findFirst({
      where: {
        userId: user.id,
        name,
        currency,
        institutionId: institutionId || null,
      },
    });

    if (existing) {
      throw new Error(`Ya existe un producto con el nombre "${name}" y moneda "${currency}" en esta institución`);
    }

    // Crear producto y transacción inicial si hay saldo
    await prisma.$transaction(async (tx) => {
      const product = await tx.financialProduct.create({
        data: {
          name,
          type,
          currency,
          balance,
          closingDay: closingDay || null,
          dueDay: dueDay || null,
          limit: limit || null,
          limitSinglePayment: limitSinglePayment || null,
          limitInstallments: limitInstallments || null,
          sharedLimit: sharedLimit || false,
          unifiedLimit: unifiedLimit || false,
          linkedProductId: linkedProductId || null,
          lastFourDigits: lastFourDigits || null,
          provider: provider as any,
          expirationDate: expirationDate ? new Date(`${expirationDate}T12:00:00`) : null,
          institutionId: institutionId || null,
          userId: user.id,
        },
      });

      if (Number(balance) !== 0) {
        await tx.transaction.create({
          data: {
            amount: Math.abs(Number(balance)),
            date: new Date(),
            description: 'Saldo inicial',
            type: Number(balance) > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
            fromProductId: product.id,
            userId: user.id,
            status: 'COMPLETED'
          }
        });
      }
    });

    revalidatePath('/accounts');
    revalidatePath('/transactions');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validated = productSchema.parse(rawData);

    const {
      name, type, currency, balance,
      closingDay, dueDay, limit, limitSinglePayment, limitInstallments,
      sharedLimit, unifiedLimit, linkedProductId, lastFourDigits, provider, expirationDate
    } = validated;

    const user = await requireUser();

    // Obtener producto existente
    const existingProduct = await prisma.financialProduct.findUnique({
      where: { id },
      include: { institution: true },
    });

    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    // Validar moneda
    if (existingProduct.institution) {
      if (!isCurrencyAllowedForInstitution(currency, existingProduct.institution.type)) {
        throw new Error(`La moneda "${currency}" no es permitida para esta institución`);
      }
    } else if (type === ProductType.CASH) {
      if (!isCurrencyAllowedForCash(currency)) {
        throw new Error('Moneda no permitida para efectivo');
      }
    }

    // Validar balance
    const balanceValidation = validateBalance(
      balance,
      type,
      existingProduct.institution?.type
    );
    if (!balanceValidation.valid) {
      throw new Error(balanceValidation.error);
    }

    if (type === ProductType.CREDIT_CARD || type === ProductType.DEBIT_CARD) {
      if (lastFourDigits && !/^\d{4}$/.test(lastFourDigits)) {
        throw new Error('Los últimos 4 dígitos deben ser 4 números');
      }
    }

    if (type === ProductType.CREDIT_CARD) {
      const creditCardValidation = validateCreditCardFields(closingDay || null, dueDay || null, limitSinglePayment || limitInstallments || null);
      if (!creditCardValidation.valid) {
        throw new Error(creditCardValidation.error);
      }
    }

    if (type === ProductType.DEBIT_CARD) {
      if (!linkedProductId) {
        throw new Error('La tarjeta de débito debe estar vinculada a una caja de ahorro');
      }

      // Validar que la cuenta vinculada exista y sea del mismo usuario e institución
      const linkedProduct = await prisma.financialProduct.findFirst({
        where: {
          id: linkedProductId,
          userId: user.id,
          // Use existing institution ID
          institutionId: existingProduct.institutionId,
          type: ProductType.SAVINGS_ACCOUNT
        }
      });

      if (!linkedProduct) {
        throw new Error('La cuenta vinculada no es válida o no pertenece a la misma institución');
      }
    }

    if (type === ProductType.LOAN) {
      const loanValidation = validateLoanFields(limit || null);
      if (!loanValidation.valid) {
        throw new Error(loanValidation.error);
      }
    }

    // Verificar que no exista otro producto con el mismo nombre y moneda en la misma institución
    const duplicate = await prisma.financialProduct.findFirst({
      where: {
        userId: user.id,
        name,
        currency,
        institutionId: existingProduct.institutionId,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new Error(`Ya existe un producto con el nombre "${name}" y moneda "${currency}" en esta institución`);
    }

    // Calcular diferencia para el ajuste
    const oldBalance = Number(existingProduct.balance);
    const newBalance = Number(balance);
    const diff = newBalance - oldBalance;

    // Actualizar producto y crear transacción de ajuste si es necesario
    await prisma.$transaction(async (tx) => {
      await tx.financialProduct.update({
        where: { id },
        data: {
          name,
          type,
          currency,
          balance,
          closingDay: closingDay || null,
          dueDay: dueDay || null,
          limit: limit || null,
          limitSinglePayment: limitSinglePayment || null,
          limitInstallments: limitInstallments || null,
          sharedLimit: sharedLimit || false,
          unifiedLimit: unifiedLimit || false,
          linkedProductId: linkedProductId || null,
          lastFourDigits: lastFourDigits || null,
          provider: provider as any,
          expirationDate: expirationDate ? new Date(`${expirationDate}T12:00:00`) : null,
        },
      });

      if (diff !== 0) {
        await tx.transaction.create({
          data: {
            amount: Math.abs(diff),
            date: new Date(),
            description: 'Ajuste de saldo manual',
            type: diff > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
            fromProductId: id,
            userId: user.id,
            status: 'COMPLETED'
          }
        });
      }
    });

    revalidatePath('/accounts');
    revalidatePath('/transactions');
    revalidatePath('/calendar');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function deleteProduct(id: string) {
  try {
    const user = await requireUser();

    // Verificar que el producto pertenece al usuario
    const product = await prisma.financialProduct.findUnique({
      where: { id },
    });

    if (!product) {
      return { success: false, error: 'Producto no encontrado' };
    }

    if (product.userId !== user.id) {
      return { success: false, error: 'No autorizado' };
    }

    // Eliminar transacciones y summaries (transactional)
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          OR: [
            { fromProductId: id },
            { toProductId: id }
          ]
        }
      });

      await tx.creditCardSummary.deleteMany({
        where: { productId: id }
      });

      await tx.financialProduct.delete({
        where: { id },
      });
    });


    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return { success: false, error: 'Error al eliminar el producto' };
  }
}

// ============================================================================
// GET DATA FOR ACCOUNTS PAGE
// ============================================================================

export async function getAccountsPageData() {
  try {
    const user = await requireUser();

    const institutions = await prisma.financialInstitution.findMany({
      where: { userId: user.id },
      include: {
        products: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const cashProducts = await prisma.financialProduct.findMany({
      where: {
        userId: user.id,
        institutionId: null,
        type: ProductType.CASH,
      },
      orderBy: { name: 'asc' },
    });

    // Use our new Helper for Exchange Rate (defaults included)
    const usdToArsRate = await getLatestExchangeRate(Currency.USD, Currency.ARS);

    return {
      institutions: institutions.map(inst => ({
        ...inst,
        // Serializamos date objects si existen en Inst
        createdAt: inst.createdAt.toISOString(),
        updatedAt: inst.updatedAt.toISOString(),
        products: inst.products.map(p => serializeFinancialProduct(p)),
      })),
      cashProducts: cashProducts.map(p => serializeFinancialProduct(p)),
      usdToArsRate,
    };
  } catch (error) {
    console.error('Error obteniendo datos de cuentas:', error);
    return {
      institutions: [],
      cashProducts: [],
      usdToArsRate: null,
    };
  }
}

export async function getProductDetails(productId: string) {
  try {
    const user = await requireUser();

    const product = await prisma.financialProduct.findUnique({
      where: {
        id: productId,
        userId: user.id,
      },
      include: {
        institution: true,
      }
    });

    if (!product) {
      return null;
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromProductId: productId },
          { toProductId: productId }
        ]
      },
      include: {
        category: true,
        fromProduct: true,
        toProduct: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Tip: using serializeFinancialProduct for nested products ensures consistency
    return {
      product: serializeFinancialProduct(product),
      transactions: transactions.map(serializeTransaction),
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}
