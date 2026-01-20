'use client'

import { useState, useRef, useEffect } from 'react';
import AddInstitutionButton from './AddInstitutionButton';
import AddProductButton from './AddProductButton';
import { InstitutionWithProducts } from '@/src/types';

interface AddActionMenuProps {
    institutions: InstitutionWithProducts[];
}

export default function AddActionMenu({ institutions }: AddActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold transition-all duration-300 relative overflow-hidden
                    ${isOpen
                        ? 'bg-white text-slate-900 shadow-xl scale-105'
                        : 'glass-button'
                    }
                `}
            >
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-500 ${isOpen ? 'rotate-45' : ''}`}>
                    add
                </span>
                <span className="tracking-tight">Agregar</span>
                {!isOpen && (
                    <span className="material-symbols-outlined text-[18px] opacity-60">
                        expand_more
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            <div className={`
                absolute right-0 mt-3 w-72 
                glass-card-elevated
                z-50 overflow-hidden 
                transition-all duration-300 transform origin-top-right
                ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }
            `}>
                <div className="p-2 space-y-1">
                    <AddProductButton
                        institutions={institutions}
                        variant="menuItem"
                        onCloseMenu={() => setIsOpen(false)}
                    />
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1" />
                    <AddInstitutionButton
                        mode="create"
                        variant="menuItem"
                        onCloseMenu={() => setIsOpen(false)}
                    />
                </div>
            </div>
        </div>
    );
}
