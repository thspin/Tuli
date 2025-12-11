'use client'

import { ChatMessage as ChatMessageType } from '@/src/types/chat'

interface ChatMessageProps {
    message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'

    if (message.isLoading) {
        return (
            <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-card-foreground'
                    }`}
            >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <span className={`text-xs mt-1 block ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {message.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    )
}
