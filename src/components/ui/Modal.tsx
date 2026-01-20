'use client'

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    description?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    resizable?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    icon,
    children,
    size = 'md',
    resizable = false
}: ModalProps) {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && modalRef.current && dimensions.width === 0) {
            const rect = modalRef.current.getBoundingClientRect();
            setDimensions({ width: rect.width, height: rect.height });
        }
    }, [isOpen, dimensions.width]);

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!resizable) return;
        e.preventDefault();
        setIsResizing(true);
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: dimensions.width,
            height: dimensions.height
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startPos.current.x;
            const deltaY = e.clientY - startPos.current.y;

            const newWidth = Math.max(400, startPos.current.width + deltaX);
            const newHeight = Math.max(300, startPos.current.height + deltaY);

            setDimensions({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    if (!isOpen || !isMounted) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]'
    };

    const modalStyle = resizable && dimensions.width > 0 ? {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        maxWidth: 'none',
        maxHeight: '90vh'
    } : {};

    const modalContent = (
        <div
            className="
                fixed inset-0 
                glass-modal-backdrop
                flex items-center justify-center 
                p-4 z-[9999] 
                animate-in fade-in duration-300
            "
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={modalRef}
                className={`
                    glass-modal
                    w-full 
                    relative flex flex-col overflow-hidden 
                    animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
                    ${(!resizable || dimensions.width === 0) ? sizeClasses[size] : ''}
                    ${isResizing ? 'select-none' : ''}
                `}
                style={{
                    ...modalStyle,
                    maxHeight: '90vh'
                }}
            >
                {/* Glass highlight on top */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                {/* Header */}
                <div className="
                    bg-white/5 
                    px-8 py-6 
                    border-b border-white/10 
                    flex justify-between items-center 
                    flex-shrink-0
                ">
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className="
                                w-12 h-12 rounded-2xl 
                                bg-gradient-to-br from-blue-500 to-blue-600 
                                text-white 
                                flex items-center justify-center 
                                shadow-lg shadow-blue-500/30
                            ">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-white glass-text">{title}</h3>
                            {description && (
                                <p className="text-white/50 text-sm mt-0.5">{description}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="
                            w-10 h-10 
                            flex items-center justify-center 
                            rounded-xl 
                            bg-white/10 
                            border border-white/10 
                            text-white/60 
                            hover:text-red-400 
                            hover:border-red-400/30 
                            hover:bg-red-400/10 
                            transition-all duration-300
                        "
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto overflow-x-hidden p-8 flex-1 custom-scrollbar">
                    {children}
                </div>

                {/* Resize handle */}
                {resizable && (
                    <div
                        onMouseDown={handleMouseDown}
                        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group"
                        title="Arrastrar para redimensionar"
                    >
                        <div className="absolute bottom-2 right-2 w-3 h-3 flex items-end justify-end">
                            <svg
                                className="w-3 h-3 text-white/30 group-hover:text-blue-400 transition-colors"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                            >
                                <path d="M14 14V9h-1v4H9v1h5z" />
                                <path d="M14 7V2H9v1h4v4h1z" />
                                <path d="M7 14V9H2v1h4v4h1z" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Glass highlight on bottom */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

// Modal Footer component for action buttons
interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
    return (
        <div className={`
            flex items-center justify-end gap-3 
            pt-6 mt-6 
            border-t border-white/10
            ${className}
        `}>
            {children}
        </div>
    );
}

// Confirmation Modal for destructive actions
interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false
}: ConfirmModalProps) {
    const iconMap = {
        danger: 'warning',
        warning: 'help',
        info: 'info'
    };

    const colorMap = {
        danger: 'from-red-500 to-red-600 shadow-red-500/30',
        warning: 'from-amber-500 to-amber-600 shadow-amber-500/30',
        info: 'from-blue-500 to-blue-600 shadow-blue-500/30'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size="sm"
            icon={
                <span className="material-symbols-outlined text-2xl">
                    {iconMap[variant]}
                </span>
            }
        >
            <ModalFooter>
                <button
                    onClick={onClose}
                    className="
                        px-6 py-3 rounded-2xl
                        bg-white/10 border border-white/10
                        text-white/70 hover:text-white hover:bg-white/20
                        font-medium transition-all duration-300
                    "
                    disabled={loading}
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className={`
                        px-6 py-3 rounded-2xl
                        bg-gradient-to-r ${colorMap[variant]}
                        text-white font-bold
                        shadow-lg
                        hover:scale-[1.02] active:scale-[0.98]
                        transition-all duration-300
                        flex items-center gap-2
                    `}
                    disabled={loading}
                >
                    {loading && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {confirmText}
                </button>
            </ModalFooter>
        </Modal>
    );
}
