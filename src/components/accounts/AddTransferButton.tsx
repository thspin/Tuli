'use client'

import { useState, useEffect } from 'react';
import { createTransfer } from '@/src/actions/transactions/transfer-actions';

interface Product {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    institutionId?: string | null;
}

interface Institution {
    id: string;
    name: string;
    type: string;
    products: Product[];
}

interface AddTransferButtonProps {
    institutions: Institution[];
    cashProducts: Product[];
}

export default function AddTransferButton({ institutions, cashProducts }: AddTransferButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Origin selection state
    const [selectedFromInstitutionId, setSelectedFromInstitutionId] = useState<string>('');
    const [selectedFromProductId, setSelectedFromProductId] = useState('');

    // Destination selection state
    const [selectedToInstitutionId, setSelectedToInstitutionId] = useState<string>('');
    const [selectedToProductId, setSelectedToProductId] = useState('');

    const [dateValue, setDateValue] = useState('');

    // Initialize date with today
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDateValue(`${year}-${month}-${day}`);
    }, []);

    // Filter products based on selected institution (for origin)
    const rawFromProducts = selectedFromInstitutionId === 'CASH'
        ? cashProducts
        : selectedFromInstitutionId
            ? institutions.find(i => i.id === selectedFromInstitutionId)?.products || []
            : [];

    // Filter valid products for transfers (no credit cards, no loans)
    const availableFromProducts = rawFromProducts.filter(p =>
        p.type === 'CASH' ||
        p.type === 'SAVINGS_ACCOUNT' ||
        p.type === 'CHECKING_ACCOUNT'
    );

    // Filter products based on selected institution (for destination)
    const rawToProducts = selectedToInstitutionId === 'CASH'
        ? cashProducts
        : selectedToInstitutionId
            ? institutions.find(i => i.id === selectedToInstitutionId)?.products || []
            : [];

    // Filter valid products for transfers (no credit cards, no loans)
    const availableToProducts = rawToProducts.filter(p =>
        p.type === 'CASH' ||
        p.type === 'SAVINGS_ACCOUNT' ||
        p.type === 'CHECKING_ACCOUNT'
    );

    // Auto-select product when institution changes and has only one valid account
    useEffect(() => {
        if (availableFromProducts.length === 1) {
            setSelectedFromProductId(availableFromProducts[0].id);
        } else {
            setSelectedFromProductId('');
        }
    }, [selectedFromInstitutionId, availableFromProducts]);

    useEffect(() => {
        if (availableToProducts.length === 1) {
            setSelectedToProductId(availableToProducts[0].id);
        } else {
            setSelectedToProductId('');
        }
    }, [selectedToInstitutionId, availableToProducts]);

    const selectedFromProduct = availableFromProducts.find(p => p.id === selectedFromProductId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const result = await createTransfer(formData);

            if (result.success) {
                form.reset();
                setSelectedFromInstitutionId('');
                setSelectedFromProductId('');
                setSelectedToInstitutionId('');
                setSelectedToProductId('');
                setIsOpen(false);
                // Reset date to today
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                setDateValue(`${year}-${month}-${day}`);
            } else {
                setError(result.error || 'Error al realizar la transferencia');
            }
        } catch (err) {
            setError('Error al realizar la transferencia');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2 w-full justify-center"
            >
                🔄 Transferir
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transferir Entre Cuentas</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* 1. Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={dateValue}
                                    onChange={(e) => setDateValue(e.target.value)}
                                    required
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* ORIGEN */}
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">📤 Cuenta de Origen</p>

                                {/* 2. Institución Origen */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Institución *
                                    </label>
                                    <select
                                        value={selectedFromInstitutionId}
                                        onChange={(e) => setSelectedFromInstitutionId(e.target.value)}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="CASH">💵 Efectivo</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id}>
                                                {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3. Cuenta Origen */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {selectedFromInstitutionId === 'CASH'
                                            ? 'Efectivo *'
                                            : selectedFromInstitutionId
                                                ? 'Cuenta / Tarjeta *'
                                                : 'Cuenta *'}
                                    </label>
                                    <select
                                        name="fromProductId"
                                        value={selectedFromProductId}
                                        onChange={(e) => setSelectedFromProductId(e.target.value)}
                                        required
                                        disabled={!selectedFromInstitutionId}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">
                                            {!selectedFromInstitutionId
                                                ? 'Seleccione una institución primero'
                                                : availableFromProducts.length > 1
                                                    ? `Seleccionar (${availableFromProducts.length} disponibles)...`
                                                    : 'Seleccionar...'}
                                        </option>
                                        {availableFromProducts.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - {product.currency} {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedFromInstitutionId && availableFromProducts.length > 1 && !selectedFromProductId && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            💡 Esta institución tiene {availableFromProducts.length} cuentas disponibles. Seleccione desde donde transferirá.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* DESTINO */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">📥 Cuenta de Destino</p>

                                {/* 4. Institución Destino */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Institución *
                                    </label>
                                    <select
                                        value={selectedToInstitutionId}
                                        onChange={(e) => setSelectedToInstitutionId(e.target.value)}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="CASH">💵 Efectivo</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id}>
                                                {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 5. Cuenta Destino */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {selectedToInstitutionId === 'CASH'
                                            ? 'Efectivo *'
                                            : selectedToInstitutionId
                                                ? 'Cuenta / Tarjeta *'
                                                : 'Cuenta *'}
                                    </label>
                                    <select
                                        name="toProductId"
                                        value={selectedToProductId}
                                        onChange={(e) => setSelectedToProductId(e.target.value)}
                                        required
                                        disabled={!selectedToInstitutionId}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">
                                            {!selectedToInstitutionId
                                                ? 'Seleccione una institución primero'
                                                : availableToProducts.length > 1
                                                    ? `Seleccionar (${availableToProducts.length} disponibles)...`
                                                    : 'Seleccionar...'}
                                        </option>
                                        {availableToProducts.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - {product.currency} {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedToInstitutionId && availableToProducts.length > 1 && !selectedToProductId && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            💡 Esta institución tiene {availableToProducts.length} cuentas disponibles. Seleccione donde recibirá el dinero.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 6. Monto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Monto {selectedFromProduct ? `(${selectedFromProduct.currency})` : ''} *
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    step="0.01"
                                    min="0.01"
                                    max={selectedFromProduct ? selectedFromProduct.balance : undefined}
                                    required
                                    placeholder={selectedFromProduct ? `Disponible: ${selectedFromProduct.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "0.00"}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                {selectedFromProduct && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Saldo disponible: {selectedFromProduct.currency} {selectedFromProduct.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>

                            {/* 7. Descripción (opcional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción (opcional)
                                </label>
                                <input
                                    type="text"
                                    name="description"
                                    placeholder="Transferencia entre cuentas"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Transferiendo...' : 'Transferir'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
