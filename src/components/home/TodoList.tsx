'use client'

import { useState, useEffect } from 'react'

interface Todo {
    id: string;
    text: string;
    date: string;
    completed: boolean;
}

export default function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [newTodo, setNewTodo] = useState('')
    const [newDate, setNewDate] = useState('')
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('tuli-todos')
        if (saved) {
            try {
                setTodos(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse todos", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('tuli-todos', JSON.stringify(todos))
        }
    }, [todos, isLoaded])

    const addTodo = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newTodo.trim()) return

        const todo: Todo = {
            id: crypto.randomUUID(),
            text: newTodo,
            date: newDate,
            completed: false
        }
        setTodos([todo, ...todos])
        setNewTodo('')
        setNewDate('')
    }

    const toggleTodo = (id: string) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    }

    const deleteTodo = (id: string) => {
        setTodos(todos.filter(t => t.id !== id))
    }

    if (!isLoaded) return null // Prevent hydration mismatch

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center gap-2">
                    <span>📝</span> Pendientes
                </h2>

                {/* Input Form */}
                <form onSubmit={addTodo} className="flex flex-col sm:flex-row gap-3 mb-8">
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Agregar nueva tarea..."
                        className="flex-1 bg-background border border-input rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="bg-background border border-input rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newTodo.trim()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Agregar
                    </button>
                </form>

                {/* Todo List */}
                <div className="space-y-3">
                    {todos.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No tienes tareas pendientes. ¡Agrega una!
                        </p>
                    ) : (
                        todos.map((todo) => (
                            <div
                                key={todo.id}
                                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${todo.completed
                                    ? 'bg-muted/30 border-transparent'
                                    : 'bg-background border-border hover:border-primary/50 hover:shadow-sm'
                                    }`}
                            >
                                <button
                                    onClick={() => toggleTodo(todo.id)}
                                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed
                                        ? 'bg-success border-success text-success-foreground'
                                        : 'border-muted-foreground hover:border-primary'
                                        }`}
                                >
                                    {todo.completed && (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={`truncate transition-all ${todo.completed
                                        ? 'text-muted-foreground line-through'
                                        : 'text-foreground font-medium'
                                        }`}>
                                        {todo.text}
                                    </p>
                                    {todo.date && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <span>📅</span>
                                            {new Date(todo.date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-2 rounded-lg transition-all"
                                    title="Eliminar"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
