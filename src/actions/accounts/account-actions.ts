'use server'

import { prisma } from "@/src/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { InstitutionType, ProductType, Currency } from "@prisma/client";
import {
  validateBalance,
  validateCreditCardFields,
  validateLoanFields,
  isProductTypeAllowedForInstitution,
  isCurrencyAllowedForInstitution,
  isCurrencyAllowedForCash,
  requiresInstitution,
} from "@/src/utils/validations";

/**
 * Obtiene o crea el usuario demo
 * TODO: Reemplazar con autenticación real
 */
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

// ============================================================================
// CRUD DE INSTITUCIONES FINANCIERAS
// ============================================================================

export async function createInstitution(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const type = formData.get('type') as InstitutionType;

    if (!name || !type) {
      throw new Error('Nombre y tipo son requeridos');
    }

    const user = await getDemoUser();

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
        userId: user.id,
      },
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

export async function updateInstitution(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const type = formData.get('type') as InstitutionType;

    if (!name || !type) {
      throw new Error('Nombre y tipo son requeridos');
    }

    const user = await getDemoUser();

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
      data: { name, type },
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
    const name = formData.get('name') as string;
    const type = formData.get('type') as ProductType;
    const currency = formData.get('currency') as Currency;
    const balance = parseFloat(formData.get('balance') as string) || 0;
    const institutionId = formData.get('institutionId') as string | null;

    if (!name || !type || !currency) {
      throw new Error('Nombre, tipo y moneda son requeridos');
    }

    const user = await getDemoUser();

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

    // Validar campos de tarjeta de crédito y préstamos
    let closingDay = null;
    let dueDay = null;
    let limit = null; // Deprecated, keeping for backward compatibility
    let limitSinglePayment = null;
    let limitInstallments = null;
    let sharedLimit = false;
    let unifiedLimit = false;
    let linkedProductId = null;
    let lastFourDigits = null;
    let provider = null;

    if (type === ProductType.CREDIT_CARD || type === ProductType.DEBIT_CARD) {
      lastFourDigits = formData.get('lastFourDigits') as string | null;
      if (lastFourDigits && !/^\d{4}$/.test(lastFourDigits)) {
        throw new Error('Los últimos 4 dígitos deben ser 4 números');
      }

      if (type === ProductType.CREDIT_CARD) {
        provider = formData.get('provider') as any;
      }
    }

    if (type === ProductType.CREDIT_CARD) {
      closingDay = formData.get('closingDay') ? parseInt(formData.get('closingDay') as string) : null;
      dueDay = formData.get('dueDay') ? parseInt(formData.get('dueDay') as string) : null;
      limitSinglePayment = formData.get('limitSinglePayment') ? parseFloat(formData.get('limitSinglePayment') as string) : null;
      limitInstallments = formData.get('limitInstallments') ? parseFloat(formData.get('limitInstallments') as string) : null;
      sharedLimit = formData.get('sharedLimit') === 'true';

      const creditCardValidation = validateCreditCardFields(closingDay, dueDay, limitSinglePayment || limitInstallments);
      if (!creditCardValidation.valid) {
        throw new Error(creditCardValidation.error);
      }
    }

    if (type === ProductType.DEBIT_CARD) {
      linkedProductId = formData.get('linkedProductId') as string | null;

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
      limit = formData.get('limit') ? parseFloat(formData.get('limit') as string) : null;

      const loanValidation = validateLoanFields(limit);
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

    // Crear producto
    await prisma.financialProduct.create({
      data: {
        name,
        type,
        currency,
        balance,
        closingDay,
        dueDay,
        limit,
        limitSinglePayment,
        limitInstallments,
        sharedLimit,
        unifiedLimit,
        linkedProductId,
        lastFourDigits,
        provider,
        institutionId: institutionId || null,
        userId: user.id,
      },
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

export async function updateProduct(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const type = formData.get('type') as ProductType;
    const currency = formData.get('currency') as Currency;
    const balance = parseFloat(formData.get('balance') as string) || 0;

    if (!name || !type || !currency) {
      throw new Error('Nombre, tipo y moneda son requeridos');
    }

    const user = await getDemoUser();

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

    // Validar campos de tarjeta de crédito y préstamos
    let closingDay = null;
    let dueDay = null;
    let limit = null; // Deprecated
    let limitSinglePayment = null;
    let limitInstallments = null;
    let sharedLimit = false;
    let unifiedLimit = false;
    let linkedProductId = null;
    let lastFourDigits = null;
    let provider = null;

    if (type === ProductType.CREDIT_CARD || type === ProductType.DEBIT_CARD) {
      lastFourDigits = formData.get('lastFourDigits') as string | null;
      if (lastFourDigits && !/^\d{4}$/.test(lastFourDigits)) {
        throw new Error('Los últimos 4 dígitos deben ser 4 números');
      }

      if (type === ProductType.CREDIT_CARD) {
        provider = formData.get('provider') as any;
      }
    }

    if (type === ProductType.CREDIT_CARD) {
      closingDay = formData.get('closingDay') ? parseInt(formData.get('closingDay') as string) : null;
      dueDay = formData.get('dueDay') ? parseInt(formData.get('dueDay') as string) : null;
      limitSinglePayment = formData.get('limitSinglePayment') ? parseFloat(formData.get('limitSinglePayment') as string) : null;
      limitInstallments = formData.get('limitInstallments') ? parseFloat(formData.get('limitInstallments') as string) : null;
      sharedLimit = formData.get('sharedLimit') === 'true';
      unifiedLimit = formData.get('unifiedLimit') === 'true';

      const creditCardValidation = validateCreditCardFields(closingDay, dueDay, limitSinglePayment || limitInstallments);
      if (!creditCardValidation.valid) {
        throw new Error(creditCardValidation.error);
      }
    }

    if (type === ProductType.DEBIT_CARD) {
      linkedProductId = formData.get('linkedProductId') as string | null;

      if (!linkedProductId) {
        throw new Error('La tarjeta de débito debe estar vinculada a una caja de ahorro');
      }

      // Validar que la cuenta vinculada exista y sea del mismo usuario e institución
      const linkedProduct = await prisma.financialProduct.findFirst({
        where: {
          id: linkedProductId,
          userId: user.id,
          institutionId: existingProduct.institutionId,
          type: ProductType.SAVINGS_ACCOUNT
        }
      });

      if (!linkedProduct) {
        throw new Error('La cuenta vinculada no es válida o no pertenece a la misma institución');
      }
    }

    if (type === ProductType.LOAN) {
      limit = formData.get('limit') ? parseFloat(formData.get('limit') as string) : null;

      const loanValidation = validateLoanFields(limit);
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

    // Actualizar producto
    await prisma.financialProduct.update({
      where: { id },
      data: {
        name,
        type,
        currency,
        balance,
        closingDay,
        dueDay,
        limit,
        limitSinglePayment,
        limitInstallments,
        sharedLimit,
        unifiedLimit,
        linkedProductId,
        lastFourDigits,
        provider,
      },
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

export async function deleteProduct(id: string) {
  try {
    const user = await getDemoUser();

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

    // Eliminar todas las transacciones asociadas al producto
    // (tanto como origen como destino)
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { fromProductId: id },
          { toProductId: id }
        ]
      }
    });

    // Eliminar todos los resúmenes de tarjeta asociados
    await prisma.creditCardSummary.deleteMany({
      where: { productId: id }
    });

    // Ahora eliminar el producto
    await prisma.financialProduct.delete({
      where: { id },
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
    const user = await getDemoUser();

    // Obtener instituciones con sus productos
    const institutions = await prisma.financialInstitution.findMany({
      where: { userId: user.id },
      include: {
        products: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Obtener productos de efectivo (sin institución)
    const cashProducts = await prisma.financialProduct.findMany({
      where: {
        userId: user.id,
        institutionId: null,
        type: ProductType.CASH,
      },
      orderBy: { name: 'asc' },
    });

    // Obtener tipo de cambio USD/ARS
    const usdToArsExchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: Currency.USD,
        toCurrency: Currency.ARS,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return {
      institutions: institutions.map(inst => ({
        ...inst,
        createdAt: inst.createdAt.toISOString(),
        updatedAt: inst.updatedAt.toISOString(),
        products: inst.products.map(p => ({
          ...p,
          balance: Number(p.balance),
          limit: p.limit ? Number(p.limit) : null,
          limitSinglePayment: p.limitSinglePayment ? Number(p.limitSinglePayment) : null,
          limitInstallments: p.limitInstallments ? Number(p.limitInstallments) : null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      })),
      cashProducts: cashProducts.map(p => ({
        ...p,
        balance: Number(p.balance),
        limit: p.limit ? Number(p.limit) : null,
        limitSinglePayment: p.limitSinglePayment ? Number(p.limitSinglePayment) : null,
        limitInstallments: p.limitInstallments ? Number(p.limitInstallments) : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      usdToArsRate: usdToArsExchangeRate ? Number(usdToArsExchangeRate.rate) : null,
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
    const user = await getDemoUser();

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

    return {
      product: {
        id: product.id,
        name: product.name,
        type: product.type,
        currency: product.currency,
        balance: Number(product.balance),
        closingDay: product.closingDay,
        dueDay: product.dueDay,
        limit: product.limit ? Number(product.limit) : null,
        limitSinglePayment: product.limitSinglePayment ? Number(product.limitSinglePayment) : null,
        limitInstallments: product.limitInstallments ? Number(product.limitInstallments) : null,
        sharedLimit: product.sharedLimit,
        institutionId: product.institutionId,
        lastFourDigits: product.lastFourDigits,
        provider: (product as any).provider,
        userId: product.userId,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        institution: product.institution ? {
          id: product.institution.id,
          name: product.institution.name,
          type: product.institution.type,
          userId: product.institution.userId,
          createdAt: product.institution.createdAt.toISOString(),
          updatedAt: product.institution.updatedAt.toISOString(),
        } : null,
      },
      transactions: transactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        date: t.date.toISOString(),
        description: t.description,
        status: t.status,
        type: t.type,
        categoryId: t.categoryId,
        installmentNumber: t.installmentNumber,
        installmentTotal: t.installmentTotal,
        userId: t.userId,
        fromProductId: t.fromProductId,
        toProductId: t.toProductId,
        category: t.category,
        fromProduct: t.fromProduct ? {
          id: t.fromProduct.id,
          name: t.fromProduct.name,
          type: t.fromProduct.type,
          currency: t.fromProduct.currency,
          balance: Number(t.fromProduct.balance),
          limit: t.fromProduct.limit ? Number(t.fromProduct.limit) : null,
          institutionId: t.fromProduct.institutionId,
          userId: t.fromProduct.userId,
          createdAt: t.fromProduct.createdAt.toISOString(),
          updatedAt: t.fromProduct.updatedAt.toISOString(),
        } : null,
        toProduct: t.toProduct ? {
          id: t.toProduct.id,
          name: t.toProduct.name,
          type: t.toProduct.type,
          currency: t.toProduct.currency,
          balance: Number(t.toProduct.balance),
          limit: t.toProduct.limit ? Number(t.toProduct.limit) : null,
          institutionId: t.toProduct.institutionId,
          userId: t.toProduct.userId,
          createdAt: t.toProduct.createdAt.toISOString(),
          updatedAt: t.toProduct.updatedAt.toISOString(),
        } : null,
      })),
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}
