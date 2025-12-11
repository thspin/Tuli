// This file runs server-side in the API route context

import { GoogleGenerativeAI, Content, Part, FunctionDeclarationsTool } from '@google/generative-ai'
import { aiTools, executeFunction } from './tools'

// Initialize the Google Generative AI client
if (!process.env.GEMINI_API_KEY) {
    throw new Error('Falta la variable de entorno GEMINI_API_KEY');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// System instruction for the AI agent
const SYSTEM_INSTRUCTION = `Eres el asistente financiero de Tuli. Tu personalidad es extremadamente breve, robótica y eficiente.

REGLAS ESTRICTAS:
1. Cero charla social. Solo lo necesario.
2. Si faltan datos obligatorios para una acción (como cuenta, categoría o monto), pregunta SOLO por el dato faltante. NO ejecutes la función aún.
3. Confirma acciones completadas en una línea.
4. Usa los nombres de cuentas y categorías exactos del usuario.
5. Montos en ARS por defecto a menos que se especifique otra moneda.
6. Fechas: si no se especifica, usa la fecha de hoy.
7. Para gastos necesitas: monto, descripción, cuenta origen y categoría.
8. Para ingresos necesitas: monto, descripción, cuenta destino y categoría.
9. Para transferencias necesitas: monto, cuenta origen y cuenta destino.

FORMATO DE RESPUESTAS:
- Confirmaciones: "✓ [acción] registrado/a"
- Preguntas: "¿[dato faltante]?"
- Listas: formato compacto, una línea por item
- Errores: "✗ [error breve]"
`

export interface ChatMessage {
    role: 'user' | 'assistant' | 'function'
    content: string
    functionCall?: {
        name: string
        args: Record<string, unknown>
    }
    functionResponse?: {
        name: string
        response: unknown
    }
}

export interface ChatResponse {
    success: boolean
    message: string
    error?: string
}

// Convert our ChatMessage format to Gemini's Content format
// We only pass user and assistant text messages to history (not function calls/responses)
function convertToGeminiHistory(messages: ChatMessage[]): Content[] {
    const contents: Content[] = []

    for (const msg of messages) {
        if (msg.role === 'user') {
            contents.push({
                role: 'user',
                parts: [{ text: msg.content }]
            })
        } else if (msg.role === 'assistant' && !msg.functionCall) {
            // Only include text responses, not function call messages
            contents.push({
                role: 'model',
                parts: [{ text: msg.content }]
            })
        }
        // Skip 'function' role messages as they are handled inline during the session
    }

    return contents
}

export async function processMessage(
    userMessage: string,
    history: ChatMessage[],
    context?: { accounts?: string[], categories?: string[] }
): Promise<ChatResponse> {
    try {
        // Build context string
        let contextInfo = ''
        if (context?.accounts && context.accounts.length > 0) {
            contextInfo += `\nCuentas disponibles: ${context.accounts.join(', ')}`
        }
        if (context?.categories && context.categories.length > 0) {
            contextInfo += `\nCategorías disponibles: ${context.categories.join(', ')}`
        }

        const fullSystemInstruction = SYSTEM_INSTRUCTION + contextInfo

        // Get the model with tools
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-001',
            systemInstruction: fullSystemInstruction,
            tools: [{ functionDeclarations: aiTools } as FunctionDeclarationsTool]
        })

        // Start chat with history
        const chat = model.startChat({
            history: convertToGeminiHistory(history)
        })

        // Send user message
        let result = await chat.sendMessage(userMessage)
        let response = result.response

        // Check if the model wants to call a function
        let candidate = response.candidates?.[0]
        let parts = candidate?.content?.parts || []

        // Loop to handle function calls
        while (parts.some(part => 'functionCall' in part)) {
            const functionCallPart = parts.find(part => 'functionCall' in part)
            if (!functionCallPart || !('functionCall' in functionCallPart)) break

            const functionCall = functionCallPart.functionCall
            if (!functionCall) break

            const functionName = functionCall.name
            const functionArgs = functionCall.args as Record<string, unknown>

            console.log(`[AI Agent] Calling function: ${functionName}`, functionArgs)

            // Execute the function
            const functionResult = await executeFunction(functionName, functionArgs)

            console.log(`[AI Agent] Function result:`, functionResult)

            // Send the function result back to the model
            result = await chat.sendMessage([{
                functionResponse: {
                    name: functionName,
                    response: functionResult
                }
            }])

            response = result.response
            candidate = response.candidates?.[0]
            parts = candidate?.content?.parts || []
        }

        // Get the final text response
        const textPart = parts.find(part => 'text' in part)
        const finalMessage = (textPart && 'text' in textPart && textPart.text) ? textPart.text : 'Operación completada.'

        return {
            success: true,
            message: finalMessage
        }
    } catch (error) {
        console.error('[AI Agent] Error:', error)
        return {
            success: false,
            message: '',
            error: error instanceof Error ? error.message : 'Error desconocido en el agente'
        }
    }
}
