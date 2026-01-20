'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
    { href: '/', icon: 'home', label: 'Inicio' },
    { href: '/accounts', icon: 'account_balance_wallet', label: 'Billetera' },
    { href: '/transactions', icon: 'receipt_long', label: 'Transacciones' },
    { href: '/services', icon: 'bolt', label: 'Servicios' },
    { href: '/calendar', icon: 'calendar_month', label: 'Calendario' },
    { href: '/notes', icon: 'sticky_note_2', label: 'Notas' },
]


export default function SlimSidebar() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto max-w-fit">
                <aside className="
                relative
                flex flex-row items-center justify-center 
                px-3 py-3
                rounded-[40px] 
                bg-slate-900/60 backdrop-blur-3xl
                border border-white/20
                shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                transition-all duration-500 ease-out
            ">
                    {/* Navigation */}
                    <nav className="flex items-center gap-1 md:gap-3 relative z-10">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group relative flex flex-col items-center justify-center"
                                >
                                    {/* Background Highlight for Active / Hover */}
                                    <div className={`
                                    absolute inset-0 
                                    rounded-[30px]
                                    transition-all duration-500
                                    ${isActive
                                            ? 'bg-gradient-to-br from-blue-500/40 to-purple-500/40 opacity-100 scale-100 border border-white/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                            : 'bg-white/0 opacity-0 scale-90 group-hover:bg-white/5 group-hover:opacity-100 group-hover:scale-95'
                                        }
                                `} />

                                    {/* Icon and Label Container */}
                                    <div className="relative px-5 py-2.5 flex flex-col items-center gap-1.5 min-w-[70px] md:min-w-[85px] transition-all duration-300">
                                        <span className={`
                                        material-symbols-outlined 
                                        text-[24px] md:text-[26px]
                                        transition-all duration-300
                                        ${isActive ? 'text-white scale-110' : 'text-white/40 group-hover:text-white/80'}
                                    `}>
                                            {item.icon}
                                        </span>

                                        <span className={`
                                        text-[9px] md:text-[10px] font-bold tracking-[0.05em] uppercase text-center
                                        transition-all duration-300
                                        ${isActive ? 'text-white opacity-100' : 'text-white/30 group-hover:text-white/60'}
                                    `}>
                                            {item.label}
                                        </span>

                                        {/* Active Glow Dot */}
                                        {isActive && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Glass highlight on top */}
                    <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                </aside>
            </div>
        </div>
    )
}
