'use client'

import React, { useState, useRef, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    resizable?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    resizable = false
}: ModalProps) {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        if (isOpen && modalRef.current && dimensions.width === 0) {
            // Initialize dimensions from actual element size
            const rect = modalRef.current.getBoundingClientRect();
            setDimensions({ width: rect.width, height: rect.height });
        }
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

    if (!isOpen) return null;

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

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div
                ref={modalRef}
                className={`bg-card border border-border rounded-2xl w-full p-6 shadow-xl relative ${resizable && dimensions.width === 0 ? sizeClasses[size] : ''
                    } ${isResizing ? 'select-none' : ''}`}
                style={modalStyle}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div className={resizable ? 'overflow-auto' : ''} style={resizable ? { maxHeight: 'calc(100% - 60px)' } : {}}>
                    {children}
                </div>

                {resizable && (
                    <div
                        onMouseDown={handleMouseDown}
                        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group"
                        title="Arrastrar para redimensionar"
                    >
                        <div className="absolute bottom-1 right-1 w-4 h-4 flex items-end justify-end">
                            <svg
                                className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
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
            </div>
        </div>
    );
}
