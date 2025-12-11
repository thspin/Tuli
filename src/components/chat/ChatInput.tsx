'use client'

import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
    onSend: (message: string) => void
    disabled?: boolean
    placeholder?: string
}

export default function ChatInput({ onSend, disabled = false, placeholder = 'Escribe un mensaje...' }: ChatInputProps) {
    const [input, setInput] = useState('')

    const handleSend = () => {
        if (input.trim() && !disabled) {
            onSend(input.trim())
            setInput('')
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex items-center gap-2 p-3 bg-card border-t border-border">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={placeholder}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
                onClick={handleSend}
                disabled={disabled || !input.trim()}
                className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensaje"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                >
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
            </button>
        </div>
    )
}
