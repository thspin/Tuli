'use client'

import { useState, useEffect } from 'react';
import { addIncome } from '@/src/actions/accounts/income-actions';
import { getCategories } from '@/src/actions/categories/category-actions';

interface Product {
    id: string;
    name: string;
    type: string;
    currency: string;
    institutionId?: string | null;
}

interface Institution {
    id: string;
    name: string;
    type: string;
    products: Product[];
}

interface AddIncomeButtonProps {
    institutions: Institution[];
    cashProducts: Product[];
}

export default function AddIncomeButton({ institutions, cashProducts }: AddIncomeButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    // Selection state
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
    const [selectedProductId, setSelectedProductId] = useState('');

    const [dateValue, setDateValue] = useState('');

    // Inicializar fecha con el día de hoy
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDateValue(`${year}-${month}-${day}`);
    }, []);

    // Cargar categorías al abrir el modal
    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    const loadCategories = async () => {
        const result = await getCategories('INCOME');
        if (result.success) {
            setCategories(result.categories || []);
        }
    };

    // Filter products based on selected institution
    const rawAvailableProducts = selectedInstitutionId === 'CASH'
        ? cashProducts
        : selectedInstitutionId
            ? institutions.find(i => i.id === selectedInstitutionId)?.products || []
            : [];

    // Filter valid products for income (no credit cards, no loans)
    const availableProducts = rawAvailableProducts.filter(p =>
        p.type === 'CASH' ||
        p.type === 'SAVINGS_ACCOUNT' ||
        p.type === 'CHECKING_ACCOUNT'
    );

    // Reset product when institution changes
    useEffect(() => {
        setSelectedProductId('');
    }, [selectedInstitutionId]);

    const selectedProduct = availableProducts.find(p => p.id === selectedProductId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const result = await addIncome(formData);

            if (result.success) {
                form.reset();
                setSelectedInstitutionId('');
                setSelectedProductId('');
                setIsOpen(false);
                // Reset date to today
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                setDateValue(`${year}-${month}-${day}`);
            } else {
                setError(result.error || 'Error al registrar ingreso');
            }
        } catch (err) {
            setError('Error al registrar ingreso');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
            >
                💰 Agregar Ingreso
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Agregar Ingreso</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* 1. Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={dateValue}
                                    onChange={(e) => setDateValue(e.target.value)}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            {/* 2. Institución / Origen */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Institución / Origen *
                                </label>
                                <select
                                    value={selectedInstitutionId}
                                    onChange={(e) => setSelectedInstitutionId(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

                            {/* 3. Cuenta / Producto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {selectedInstitutionId === 'CASH'
                                        ? 'Efectivo *'
                                        : selectedInstitutionId
                                            ? 'Cuenta / Tarjeta *'
                                            : 'Cuenta / Producto *'}
                                </label>
                                <select
                                    name="productId"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    required
                                    disabled={!selectedInstitutionId}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">
                                        {!selectedInstitutionId
                                            ? 'Seleccione una institución primero'
                                            : availableProducts.length > 1
                                                ? `Seleccionar (${availableProducts.length} disponibles)...`
                                                : 'Seleccionar...'}
                                    </option>
                                    {availableProducts.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} ({product.currency})
                                        </option>
                                    ))}
                                </select>
                                {selectedInstitutionId && availableProducts.length > 1 && !selectedProductId && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        💡 Esta institución tiene {availableProducts.length} cuentas disponibles. Seleccione donde ingresará el dinero.
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Nota: No se puede ingresar dinero en tarjetas de crédito o préstamos
                                </p>
                            </div>

                            {/* 4. Monto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monto {selectedProduct ? `(${selectedProduct.currency})` : ''} *
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            {/* 5. Categoría */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoría
                                </label>
                                <select
                                    name="categoryId"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">Sin categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.icon ? `${category.icon} ` : ''}{category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 6. Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción *
                                </label>
                                <input
                                    type="text"
                                    name="description"
                                    required
                                    placeholder="Ej: Salario, Transferencia, etc."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar Ingreso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
