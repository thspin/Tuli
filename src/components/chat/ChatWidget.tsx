'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/src/hooks/useChat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const { messages, isLoading, error, sendMessage, clearMessages } = useChat()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    return (
        <>
            {/* Chat Panel */}
            <div
                className={`fixed bottom-20 right-6 w-96 max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300 z-50 ${isOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                style={{ height: '500px', maxHeight: 'calc(100vh - 10rem)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-semibold text-foreground">Asistente Tuli</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={clearMessages}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            title="Limpiar chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            title="Cerrar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <div className="text-4xl mb-3">🤖</div>
                            <p className="text-sm">Hola! Soy tu asistente financiero.</p>
                            <p className="text-xs mt-1">Puedes pedirme que registre gastos, ingresos o consultar tus cuentas.</p>
                        </div>
                    )}
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                    {error && (
                        <div className="text-center text-sm text-red-500 py-2">
                            {error}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <ChatInput onSend={sendMessage} disabled={isLoading} />
            </div>

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 z-50 flex items-center justify-center ${isOpen ? 'rotate-0' : 'rotate-0'
                    }`}
                aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                    </svg>
                )}
            </button>
        </>
    )
}
