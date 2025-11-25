// app/api/accounts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUsdToArsRate } from '@/lib/exchangeRate';

export async function GET() {
  try {
    // Obtener todas las instituciones con sus productos
    const institutions = await prisma.financialInstitution.findMany({
      include: {
        products: {
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Obtener productos de efectivo (sin institución)
    const cashProducts = await prisma.financialProduct.findMany({
      where: {
        institutionId: null,
        type: 'CASH',
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Obtener tipo de cambio USD/ARS
    const usdToArsRate = await getUsdToArsRate();

    return NextResponse.json({
      institutions: institutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: inst.type,
        products: inst.products.map((prod) => ({
          id: prod.id,
          name: prod.name,
          type: prod.type,
          currency: prod.currency,
          balance: Number(prod.balance),
          closingDay: prod.closingDay,
          dueDay: prod.dueDay,
          limit: prod.limit ? Number(prod.limit) : null,
        })),
      })),
      cashProducts: cashProducts.map((prod) => ({
        id: prod.id,
        name: prod.name,
        type: prod.type,
        currency: prod.currency,
        balance: Number(prod.balance),
        closingDay: prod.closingDay,
        dueDay: prod.dueDay,
        limit: prod.limit ? Number(prod.limit) : null,
      })),
      usdToArsRate,
    });
  } catch (error) {
    console.error('Error en API /api/accounts:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
