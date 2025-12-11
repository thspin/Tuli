// Note: This file is NOT a server action file because it exports objects (aiTools).
// The executeFunction calls server actions directly.

import { FunctionDeclaration, SchemaType } from '@google/generative-ai'
import { createTransaction, deleteTransaction, getTransactions } from '@/src/actions/transactions/transaction-actions'
import { getAccountsPageData } from '@/src/actions/accounts/account-actions'
import { getCategories } from '@/src/actions/categories/category-actions'
import { getServices } from '@/src/actions/services/service-actions'

// Tool definitions for Gemini Function Calling
export const aiTools: FunctionDeclaration[] = [
    {
        name: 'create_expense',
        description: 'Crear un gasto/egreso. Requiere monto, descripción, cuenta origen y categoría.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                amount: {
                    type: SchemaType.NUMBER,
                    description: 'Monto del gasto en la moneda de la cuenta'
                },
                description: {
                    type: SchemaType.STRING,
                    description: 'Descripción breve del gasto'
                },
                fromProductId: {
                    type: SchemaType.STRING,
                    description: 'ID del producto/cuenta de origen'
                },
                categoryId: {
                    type: SchemaType.STRING,
                    description: 'ID de la categoría del gasto'
                },
                date: {
                    type: SchemaType.STRING,
                    description: 'Fecha en formato ISO (YYYY-MM-DD). Por defecto hoy.'
                },
                installments: {
                    type: SchemaType.INTEGER,
                    description: 'Número de cuotas (solo para tarjetas de crédito). Por defecto 1.'
                }
            },
            required: ['amount', 'description', 'fromProductId', 'categoryId']
        }
    },
    {
        name: 'create_income',
        description: 'Crear un ingreso. Requiere monto, descripción, cuenta destino y categoría.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                amount: {
                    type: SchemaType.NUMBER,
                    description: 'Monto del ingreso'
                },
                description: {
                    type: SchemaType.STRING,
                    description: 'Descripción breve del ingreso'
                },
                toProductId: {
                    type: SchemaType.STRING,
                    description: 'ID del producto/cuenta destino'
                },
                categoryId: {
                    type: SchemaType.STRING,
                    description: 'ID de la categoría del ingreso'
                },
                date: {
                    type: SchemaType.STRING,
                    description: 'Fecha en formato ISO (YYYY-MM-DD). Por defecto hoy.'
                }
            },
            required: ['amount', 'description', 'toProductId', 'categoryId']
        }
    },
    {
        name: 'create_transfer',
        description: 'Crear una transferencia entre cuentas. Requiere monto, cuenta origen y cuenta destino.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                amount: {
                    type: SchemaType.NUMBER,
                    description: 'Monto a transferir'
                },
                fromProductId: {
                    type: SchemaType.STRING,
                    description: 'ID del producto/cuenta de origen'
                },
                toProductId: {
                    type: SchemaType.STRING,
                    description: 'ID del producto/cuenta destino'
                },
                description: {
                    type: SchemaType.STRING,
                    description: 'Descripción de la transferencia'
                },
                date: {
                    type: SchemaType.STRING,
                    description: 'Fecha en formato ISO (YYYY-MM-DD). Por defecto hoy.'
                }
            },
            required: ['amount', 'fromProductId', 'toProductId']
        }
    },
    {
        name: 'get_accounts',
        description: 'Obtener lista de todas las cuentas y productos financieros del usuario',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {}
        }
    },
    {
        name: 'get_categories',
        description: 'Obtener lista de categorías disponibles',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                type: {
                    type: SchemaType.STRING,
                    description: 'Filtrar por tipo. Valores válidos: INCOME, EXPENSE'
                }
            }
        }
    },
    {
        name: 'get_transactions',
        description: 'Obtener lista de transacciones con filtros opcionales',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                productId: {
                    type: SchemaType.STRING,
                    description: 'Filtrar por ID de producto'
                },
                startDate: {
                    type: SchemaType.STRING,
                    description: 'Fecha de inicio en formato ISO'
                },
                endDate: {
                    type: SchemaType.STRING,
                    description: 'Fecha de fin en formato ISO'
                },
                type: {
                    type: SchemaType.STRING,
                    description: 'Tipo de transacción. Valores válidos: INCOME, EXPENSE, TRANSFER'
                }
            }
        }
    },
    {
        name: 'get_services',
        description: 'Obtener lista de servicios registrados (luz, gas, internet, etc.)',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {}
        }
    },
    {
        name: 'delete_transaction',
        description: 'Eliminar una transacción existente por su ID',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                transactionId: {
                    type: SchemaType.STRING,
                    description: 'ID de la transacción a eliminar'
                }
            },
            required: ['transactionId']
        }
    }
]

// Function executor - maps function names to actual implementations
export async function executeFunction(
    functionName: string,
    args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
        switch (functionName) {
            case 'create_expense': {
                const formData = new FormData()
                formData.set('amount', String(args.amount))
                formData.set('description', args.description as string)
                formData.set('fromProductId', args.fromProductId as string)
                formData.set('categoryId', args.categoryId as string)
                formData.set('type', 'EXPENSE')
                formData.set('date', (args.date as string) || new Date().toISOString().split('T')[0])
                if (args.installments && Number(args.installments) > 1) {
                    formData.set('installments', String(args.installments))
                }
                const result = await createTransaction(formData)
                return result.success
                    ? { success: true, data: 'Gasto registrado correctamente' }
                    : { success: false, error: result.error }
            }

            case 'create_income': {
                const formData = new FormData()
                formData.set('amount', String(args.amount))
                formData.set('description', args.description as string)
                formData.set('fromProductId', args.toProductId as string) // For income, destination is fromProductId
                formData.set('categoryId', args.categoryId as string)
                formData.set('type', 'INCOME')
                formData.set('date', (args.date as string) || new Date().toISOString().split('T')[0])
                const result = await createTransaction(formData)
                return result.success
                    ? { success: true, data: 'Ingreso registrado correctamente' }
                    : { success: false, error: result.error }
            }

            case 'create_transfer': {
                const formData = new FormData()
                formData.set('amount', String(args.amount))
                formData.set('description', (args.description as string) || 'Transferencia')
                formData.set('fromProductId', args.fromProductId as string)
                formData.set('toProductId', args.toProductId as string)
                formData.set('type', 'TRANSFER')
                formData.set('date', (args.date as string) || new Date().toISOString().split('T')[0])
                const result = await createTransaction(formData)
                return result.success
                    ? { success: true, data: 'Transferencia registrada correctamente' }
                    : { success: false, error: result.error }
            }

            case 'get_accounts': {
                const data = await getAccountsPageData()
                // Format for readable response
                const accounts = data.institutions?.flatMap(inst =>
                    inst.products.map((p: { name: string; type: string; balance: number; currency: string; id: string }) => ({
                        id: p.id,
                        name: `${inst.name} - ${p.name}`,
                        type: p.type,
                        balance: p.balance,
                        currency: p.currency
                    }))
                ) || []
                return { success: true, data: accounts }
            }

            case 'get_categories': {
                const type = args.type as 'INCOME' | 'EXPENSE' | undefined
                const result = await getCategories(type)
                const categories = result.categories?.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.categoryType
                })) || []
                return { success: true, data: categories }
            }

            case 'get_transactions': {
                const filters: {
                    productId?: string
                    startDate?: string
                    endDate?: string
                    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
                } = {}
                if (args.productId) filters.productId = args.productId as string
                if (args.startDate) filters.startDate = args.startDate as string
                if (args.endDate) filters.endDate = args.endDate as string
                if (args.type) filters.type = args.type as 'INCOME' | 'EXPENSE' | 'TRANSFER'

                const result = await getTransactions(filters)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const transactions = result.transactions?.slice(0, 20).map((t: any) => ({
                    id: t.id,
                    amount: t.amount,
                    description: t.description,
                    type: t.type,
                    date: t.date,
                    category: t.category?.name
                })) || []
                return { success: true, data: transactions }
            }

            case 'get_services': {
                const result = await getServices()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const services = (result.data as any[])?.map((s: { id: string; name: string; defaultAmount: number | null; active: boolean }) => ({
                    id: s.id,
                    name: s.name,
                    defaultAmount: s.defaultAmount,
                    active: s.active
                })) || []
                return { success: true, data: services }
            }

            case 'delete_transaction': {
                const result = await deleteTransaction(args.transactionId as string)
                return result.success
                    ? { success: true, data: 'Transacción eliminada correctamente' }
                    : { success: false, error: result.error }
            }

            default:
                return { success: false, error: `Función desconocida: ${functionName}` }
        }
    } catch (error) {
        console.error(`[Tool Executor] Error in ${functionName}:`, error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al ejecutar la función'
        }
    }
}

// Helper to get context for the AI
export async function getAIContext(): Promise<{
    accounts: { id: string; name: string; type: string }[]
    categories: { id: string; name: string; type: string }[]
}> {
    try {
        const [accountsData, categoriesData] = await Promise.all([
            getAccountsPageData(),
            getCategories()
        ])

        const accounts = accountsData.institutions?.flatMap(inst =>
            inst.products.map((p: { id: string; name: string; type: string }) => ({
                id: p.id,
                name: `${inst.name} - ${p.name}`,
                type: p.type
            }))
        ) || []

        const categories = categoriesData.categories?.map(c => ({
            id: c.id,
            name: c.name,
            type: c.categoryType
        })) || []

        return { accounts, categories }
    } catch (error) {
        console.error('[AI Context] Error fetching context:', error)
        return { accounts: [], categories: [] }
    }
}
