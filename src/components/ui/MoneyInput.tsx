'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    label?: string;
    error?: string;
    currency?: string;
    onChange?: (value: string) => void; // Returns the unformatted value
}

/**
 * Formatea un número con el formato argentino: 100.000,00
 */
function formatArgentineNumber(value: string): string {
    // Eliminar todo excepto dígitos y coma
    const cleanValue = value.replace(/[^\d,]/g, '');

    // Separar parte entera y decimal
    const parts = cleanValue.split(',');
    let integerPart = parts[0] || '';
    let decimalPart = parts[1] || '';

    // Limitar decimales a 2 dígitos
    decimalPart = decimalPart.substring(0, 2);

    // Formatear parte entera con puntos cada 3 dígitos
    if (integerPart) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Retornar formateado
    if (parts.length > 1 || cleanValue.includes(',')) {
        return `${integerPart},${decimalPart}`;
    }

    return integerPart;
}

/**
 * Convierte formato argentino a formato estándar (para enviar al servidor)
 * 100.000,50 -> 100000.50
 */
function unformatArgentineNumber(value: string): string {
    return value.replace(/\./g, '').replace(',', '.');
}

/**
 * Convierte valor estándar a formato argentino (para mostrar)
 * 100000.50 -> 100.000,50
 */
function standardToArgentine(value: string | number): string {
    if (!value && value !== 0) return '';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';

    return numValue.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export default function MoneyInput({
    label,
    error,
    className = '',
    currency = '$',
    value,
    onChange,
    ...props
}: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Inicializar displayValue cuando value cambia externamente
    useEffect(() => {
        if (value !== undefined && !isFocused) {
            const strValue = String(value);
            if (strValue === '' || strValue === '0') {
                setDisplayValue('');
            } else {
                // Si viene en formato estándar (123.45), convertir a argentino
                const formatted = standardToArgentine(strValue);
                setDisplayValue(formatted);
            }
        }
    }, [value, isFocused]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Permitir vacío
        if (inputValue === '') {
            setDisplayValue('');
            onChange?.('');
            return;
        }

        // Formatear mientras se escribe
        const formatted = formatArgentineNumber(inputValue);
        setDisplayValue(formatted);

        // Enviar valor sin formato al parent
        const unformatted = unformatArgentineNumber(formatted);
        onChange?.(unformatted);
    }, [onChange]);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);

        // Al perder el foco, asegurar formato correcto con decimales
        if (displayValue) {
            const unformatted = unformatArgentineNumber(displayValue);
            const num = parseFloat(unformatted);

            if (!isNaN(num)) {
                const formatted = standardToArgentine(num);
                setDisplayValue(formatted);
            }
        }
    };

    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1">
                    {label.includes('*') ? (
                        <>
                            {label.replace(' *', '').replace('*', '')}
                            <span className="text-red-400 ml-0.5">*</span>
                        </>
                    ) : label}
                </label>
            )}
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 font-medium pointer-events-none text-base">
                    {currency}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    className={`w-full pl-10 pr-5 py-4 glass-input rounded-2xl text-base text-white font-medium placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 ${error ? 'border-red-500/50 focus:ring-red-500/10' : ''
                        } ${className}`}
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-400 ml-1">{error}</p>
            )}
        </div>
    );
}
