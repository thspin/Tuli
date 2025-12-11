export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    isLoading?: boolean
}

export interface ChatContext {
    accounts: Array<{
        id: string
        name: string
        type: string
    }>
    categories: Array<{
        id: string
        name: string
        type: string
    }>
}

export interface ChatAPIResponse {
    success: boolean
    message?: string
    error?: string
    context?: ChatContext
}
