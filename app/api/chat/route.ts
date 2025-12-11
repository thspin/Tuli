import { NextRequest, NextResponse } from 'next/server'
import { processMessage, ChatMessage } from '@/src/lib/ai/agent'
import { getAIContext } from '@/src/lib/ai/tools'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message, history = [] } = body as {
            message: string
            history: ChatMessage[]
        }

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Mensaje requerido' },
                { status: 400 }
            )
        }

        // Get context for the AI (available accounts and categories)
        const context = await getAIContext()
        const contextStrings = {
            accounts: context.accounts.map(a => `${a.name} (ID: ${a.id})`),
            categories: context.categories.map(c => `${c.name} [${c.type}] (ID: ${c.id})`)
        }

        // Process the message with the AI agent
        const response = await processMessage(message, history, contextStrings)

        if (!response.success) {
            return NextResponse.json(
                { success: false, error: response.error || 'Error procesando mensaje' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: response.message,
            context: {
                accounts: context.accounts,
                categories: context.categories
            }
        })
    } catch (error) {
        console.error('[Chat API] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Error interno del servidor'
            },
            { status: 500 }
        )
    }
}
