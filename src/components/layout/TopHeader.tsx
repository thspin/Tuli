'use client'

import React from 'react'

export default function TopHeader() {
    return (
        <header className="h-16 flex items-center justify-between px-8 bg-transparent">
            {/* Left: Dynamic Breadcrumb-like title */}
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Tuli AI</span>
            </div>

            {/* Right: Simple User Profile */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 group cursor-pointer bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Usuario</span>
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                        U
                    </div>
                </div>
            </div>
        </header>
    )
}
