'use client'

import { useState, useCallback } from 'react'
import { ChatMessage, ChatAPIResponse, ChatContext } from '@/src/types/chat'
import { v4 as uuidv4 } from 'uuid'

interface UseChatReturn {
    messages: ChatMessage[]
    isLoading: boolean
    error: string | null
    context: ChatContext | null
    sendMessage: (content: string) => Promise<void>
    clearMessages: () => void
}

export function useChat(): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [context, setContext] = useState<ChatContext | null>(null)

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return

        setError(null)
        setIsLoading(true)

        // Add user message
        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        }

        // Add loading placeholder for assistant
        const loadingMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true
        }

        setMessages(prev => [...prev, userMessage, loadingMessage])

        try {
            // Prepare history for API (exclude loading message)
            const historyForAPI = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: content.trim(),
                    history: historyForAPI
                })
            })

            const data: ChatAPIResponse = await response.json()

            // Remove loading message and add real response
            setMessages(prev => {
                const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id)

                if (data.success && data.message) {
                    return [...withoutLoading, {
                        id: uuidv4(),
                        role: 'assistant' as const,
                        content: data.message,
                        timestamp: new Date()
                    }]
                } else {
                    return [...withoutLoading, {
                        id: uuidv4(),
                        role: 'assistant' as const,
                        content: `✗ ${data.error || 'Error desconocido'}`,
                        timestamp: new Date()
                    }]
                }
            })

            // Update context if provided
            if (data.context) {
                setContext(data.context)
            }
        } catch (err) {
            console.error('[useChat] Error:', err)
            setError(err instanceof Error ? err.message : 'Error de conexión')

            // Remove loading message on error
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id))
        } finally {
            setIsLoading(false)
        }
    }, [messages, isLoading])

    const clearMessages = useCallback(() => {
        setMessages([])
        setError(null)
    }, [])

    return {
        messages,
        isLoading,
        error,
        context,
        sendMessage,
        clearMessages
    }
}
