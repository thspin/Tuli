'use client'

import { useState, useEffect, useRef } from 'react';
import { Product, InstitutionWithProducts, Category } from '@/src/types';
import { Button } from '@/src/components/ui';

interface BulkTransactionRow {
    id: string;
    date: string;
    institutionId: string;
    productId: string;
    amount: string;
    categoryId: string;
    description: string;
    installments: number;
    installmentAmount: string;
}

interface BulkTransactionGridProps {
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    categories: Category[];
    onSubmit: (transactions: BulkTransactionRow[]) => Promise<void>;
}

export default function BulkTransactionGrid({
    institutions,
    cashProducts,
    categories,
    onSubmit
}: BulkTransactionGridProps) {
    const [rows, setRows] = useState<BulkTransactionRow[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize with one empty row
    useEffect(() => {
        addEmptyRow();
    }, []);

    const createEmptyRow = (): BulkTransactionRow => ({
        id: `row-${Date.now()}-${Math.random()}`,
        date: new Date().toISOString().split('T')[0],
        institutionId: '',
        productId: '',
        amount: '',
        categoryId: '',
        description: '',
        installments: 1,
        installmentAmount: ''
    });

    const addEmptyRow = () => {
        setRows(prev => [...prev, createEmptyRow()]);
    };

    const updateRow = (rowId: string, field: keyof BulkTransactionRow, value: string | number) => {
        setRows(prev => prev.map(row => {
            if (row.id === rowId) {
                const updated = { ...row, [field]: value };

                // Auto-calculate installment amount when amount or installments change
                if ((field === 'amount' || field === 'installments') && updated.installments > 1 && updated.amount) {
                    const totalAmount = parseFloat(updated.amount);
                    const installments = Number(updated.installments);
                    if (!isNaN(totalAmount) && installments > 0) {
                        updated.installmentAmount = (totalAmount / installments).toFixed(2);
                    }
                }

                // Reset productId when institution changes
                if (field === 'institutionId') {
                    updated.productId = '';
                }

                return updated;
            }
            return row;
        }));
    };

    const deleteRow = (rowId: string) => {
        if (rows.length > 1) {
            setRows(prev => prev.filter(row => row.id !== rowId));
        }
    };

    const getAvailableProducts = (institutionId: string): Product[] => {
        if (institutionId === 'CASH') {
            return cashProducts;
        }
        return institutions.find(i => i.id === institutionId)?.products || [];
    };

    const isRowValid = (row: BulkTransactionRow): boolean => {
        return !!(
            row.date &&
            row.productId &&
            row.amount &&
            parseFloat(row.amount) > 0 &&
            row.description
        );
    };

    const handleSubmit = async () => {
        const validRows = rows.filter(isRowValid);

        if (validRows.length === 0) {
            alert('Por favor complete al menos una transacción válida');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(validRows);
            // Reset to single empty row on success
            setRows([createEmptyRow()]);
        } catch (error) {
            console.error('Error submitting bulk transactions:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const validRowCount = rows.filter(isRowValid).length;

    return (
        <div className="flex flex-col h-full max-h-[75vh]">
            {/* Header with sticky controls */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="text-sm text-muted-foreground">
                    {validRowCount} de {rows.length} transacciones válidas
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={addEmptyRow}
                        variant="ghost"
                        size="sm"
                        icon={<span>➕</span>}
                    >
                        Agregar fila
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || validRowCount === 0}
                        variant="primary"
                        size="sm"
                    >
                        {isSubmitting ? 'Guardando...' : `Cargar ${validRowCount} transacciones`}
                    </Button>
                </div>
            </div>

            {/* Scrollable grid container */}
            <div className="flex-1 overflow-auto border border-border rounded-lg">
                <table className="w-full border-collapse bg-card">
                    <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                        <tr>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[120px]">
                                Fecha
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[150px]">
                                Institución
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[150px]">
                                Cuenta/Producto
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[120px]">
                                Monto
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[150px]">
                                Categoría
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[200px]">
                                Descripción
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[100px]">
                                Cuotas
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-left border-b border-r border-border min-w-[120px]">
                                Valor Cuota
                            </th>
                            <th className="px-2 py-2 text-xs font-semibold text-center border-b border-border w-[50px]">
                                🗑️
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => {
                            const products = getAvailableProducts(row.institutionId);
                            const selectedProduct = products.find(p => p.id === row.productId);
                            const isCreditCard = selectedProduct?.type === 'CREDIT_CARD';
                            const isValid = isRowValid(row);

                            return (
                                <tr
                                    key={row.id}
                                    className={`
                                        border-b border-border hover:bg-muted/30 transition-colors
                                        ${!isValid && rowIndex > 0 ? 'opacity-50' : ''}
                                    `}
                                >
                                    {/* Date */}
                                    <td className="p-0 border-r border-border">
                                        <input
                                            type="date"
                                            value={row.date}
                                            onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </td>

                                    {/* Institution */}
                                    <td className="p-0 border-r border-border">
                                        <select
                                            value={row.institutionId}
                                            onChange={(e) => updateRow(row.id, 'institutionId', e.target.value)}
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="CASH">💵 Efectivo</option>
                                            {institutions.map(inst => (
                                                <option key={inst.id} value={inst.id}>
                                                    {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Product */}
                                    <td className="p-0 border-r border-border">
                                        <select
                                            value={row.productId}
                                            onChange={(e) => updateRow(row.id, 'productId', e.target.value)}
                                            disabled={!row.institutionId}
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">
                                                {!row.institutionId ? 'Elija institución' : 'Seleccionar...'}
                                            </option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} ({product.currency})
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Amount */}
                                    <td className="p-0 border-r border-border">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.amount}
                                            onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                            placeholder="0.00"
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </td>

                                    {/* Category */}
                                    <td className="p-0 border-r border-border">
                                        <select
                                            value={row.categoryId}
                                            onChange={(e) => updateRow(row.id, 'categoryId', e.target.value)}
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                        >
                                            <option value="">Sin categoría</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.icon ? `${category.icon} ` : ''}{category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Description */}
                                    <td className="p-0 border-r border-border">
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                            placeholder="Descripción..."
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </td>

                                    {/* Installments */}
                                    <td className="p-0 border-r border-border">
                                        <input
                                            type="number"
                                            min="1"
                                            max="36"
                                            value={row.installments}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value) || 1;
                                                const clampedValue = Math.max(1, Math.min(36, value));
                                                updateRow(row.id, 'installments', clampedValue);
                                            }}
                                            disabled={!isCreditCard}
                                            placeholder={isCreditCard ? "1-36" : "-"}
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </td>

                                    {/* Installment Amount */}
                                    <td className="p-0 border-r border-border">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.installmentAmount}
                                            onChange={(e) => updateRow(row.id, 'installmentAmount', e.target.value)}
                                            disabled={!isCreditCard || row.installments <= 1}
                                            placeholder={isCreditCard && row.installments > 1 ? '0.00' : '-'}
                                            className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </td>

                                    {/* Delete */}
                                    <td className="p-0 text-center border-border">
                                        <button
                                            onClick={() => deleteRow(row.id)}
                                            disabled={rows.length === 1}
                                            className="w-full h-full px-2 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Eliminar fila"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer with add row button */}
            <div className="mt-3 pt-3 border-t border-border">
                <button
                    onClick={addEmptyRow}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <span className="text-lg">➕</span>
                    <span>Agregar otra transacción</span>
                </button>
            </div>
        </div>
    );
}
