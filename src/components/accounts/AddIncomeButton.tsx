'use client'

import { useState, useEffect, useMemo } from 'react';
import { addIncome } from '@/src/actions/accounts/income-actions';
import { addIncomeByCredit } from '@/src/actions/accounts/income-by-credit-actions';
import { getCategories } from '@/src/actions/categories/category-actions';
import { Modal, Input, Select, Button, MoneyInput } from '@/src/components/ui';
import { getTodayInBuenosAires } from '@/src/utils/date';

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
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // For "Ingreso por crédito" special flow
    const [creditCardInstitutionId, setCreditCardInstitutionId] = useState<string>('');
    const [creditCardProductId, setCreditCardProductId] = useState('');
    const [commission, setCommission] = useState('');

    const [dateValue, setDateValue] = useState('');

    // Inicializar fecha con el día de hoy
    useEffect(() => {
        setDateValue(getTodayInBuenosAires());
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

    // Detectar si es "Ingreso por crédito"
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const isIncomeByCredit = selectedCategory?.name?.toLowerCase().includes('crédito') ||
        selectedCategory?.name?.toLowerCase().includes('credito');

    // Debug: Log cuando cambia la categoría seleccionada
    useEffect(() => {
        if (selectedCategoryId) {
            console.log('🔍 Categoría seleccionada:', {
                id: selectedCategoryId,
                name: selectedCategory?.name,
                isIncomeByCredit,
                todasLasCategorias: categories.map(c => c.name)
            });
        }
    }, [selectedCategoryId, selectedCategory, isIncomeByCredit, categories]);

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

    // For destination when it's income by credit: only Astropay products
    const astropayInstitution = useMemo(() =>
        institutions.find(i => i.name.toLowerCase().includes('astropay')),
        [institutions]);

    const astropayProducts = useMemo(() => {
        if (!isIncomeByCredit || !astropayInstitution) return [];
        return astropayInstitution.products.filter(p =>
            p.type === 'CASH' ||
            p.type === 'SAVINGS_ACCOUNT' ||
            p.type === 'CHECKING_ACCOUNT'
        );
    }, [isIncomeByCredit, astropayInstitution]);

    // For credit card selection: ALL institutions that have credit cards
    const creditCardInstitutions = useMemo(() =>
        institutions.filter(inst =>
            inst.products.some(p => p.type === 'CREDIT_CARD')
        ),
        [institutions]);

    const rawCreditCardProducts = creditCardInstitutionId
        ? institutions.find(i => i.id === creditCardInstitutionId)?.products || []
        : [];

    const availableCreditCards = rawCreditCardProducts.filter(p => p.type === 'CREDIT_CARD');

    // Reset product when institution changes
    useEffect(() => {
        setSelectedProductId('');
    }, [selectedInstitutionId]);

    useEffect(() => {
        setCreditCardProductId('');
    }, [creditCardInstitutionId]);

    const selectedProduct = availableProducts.find(p => p.id === selectedProductId);
    const selectedCreditCard = availableCreditCards.find(p => p.id === creditCardProductId);

    // State for Keep Open feature
    const [keepOpen, setKeepOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            // Use different action based on whether it's income by credit
            const result = isIncomeByCredit
                ? await addIncomeByCredit(formData)
                : await addIncome(formData);

            if (result.success) {
                if (keepOpen) {
                    setSuccessMessage('¡Ingreso guardado! Puedes seguir cargando.');
                    // Don't reset anything - keep all values for next submission
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    form.reset();
                    setSelectedInstitutionId('');
                    setSelectedProductId('');
                    setSelectedCategoryId('');
                    setDescription('');
                    setAmount('');
                    setCreditCardInstitutionId('');
                    setCreditCardProductId('');
                    setCommission('');
                    setIsOpen(false);
                    // Reset date to today
                    setDateValue(getTodayInBuenosAires());
                }
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
            <Button
                onClick={() => setIsOpen(true)}
                variant="success"
                size="sm"
                icon={<span className="material-symbols-outlined text-[20px]">add_circle</span>}
            >
                Agregar Ingreso
            </Button>

            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    size="md"
                    title="Agregar Ingreso"
                    description="Registra una entrada de dinero"
                    icon={<span className="material-symbols-outlined text-[24px]">payments</span>}
                >
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                            <span className="material-symbols-outlined text-[20px]">error</span>
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Top Row: Date and Amount */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                type="date"
                                label="Fecha de operación"
                                name="date"
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                required
                            />
                            <div>
                                <MoneyInput
                                    label={selectedProduct ? `Monto (${selectedProduct.currency})` : 'Monto'}
                                    currency={selectedProduct?.currency === 'USD' ? 'US$' : '$'}
                                    value={amount}
                                    onChange={(value) => setAmount(value)}
                                    required
                                    placeholder="0,00"
                                />
                                <input type="hidden" name="amount" value={amount} />
                            </div>
                        </div>

                        {/* Middle Row: Category and Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Categoría"
                                name="categoryId"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                            >
                                <option value="" className="bg-slate-800">Sin categoría</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id} className="bg-slate-800">
                                        {category.icon ? `${category.icon} ` : ''}{category.name}
                                    </option>
                                ))}
                            </Select>

                            <Input
                                type="text"
                                label="Descripción"
                                name="description"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Salario, Transferencia, etc."
                            />
                        </div>

                        {/* Conditional Credit Card Selection (Only for "Ingreso por crédito") */}
                        {isIncomeByCredit && (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Tarjeta de Crédito Origen</label>
                                    </div>
                                    <div className="p-5 bg-amber-500/10 border border-amber-400/20 rounded-2xl space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                value={creditCardInstitutionId}
                                                onChange={(e) => setCreditCardInstitutionId(e.target.value)}
                                            >
                                                <option value="" className="bg-slate-800">Seleccionar Institución...</option>
                                                {creditCardInstitutions.map(inst => (
                                                    <option key={inst.id} value={inst.id} className="bg-slate-800">
                                                        {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                                    </option>
                                                ))}
                                            </Select>

                                            <Select
                                                name="creditCardProductId"
                                                value={creditCardProductId}
                                                onChange={(e) => setCreditCardProductId(e.target.value)}
                                                required={isIncomeByCredit}
                                                disabled={!creditCardInstitutionId}
                                            >
                                                <option value="" className="bg-slate-800">
                                                    {!creditCardInstitutionId
                                                        ? 'Primero seleccione institución'
                                                        : 'Seleccionar tarjeta...'}
                                                </option>
                                                {availableCreditCards.map(product => (
                                                    <option key={product.id} value={product.id} className="bg-slate-800">
                                                        {product.name} ({product.currency})
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>

                                        {/* Commission Field - Inside the card */}
                                        <div>
                                            <MoneyInput
                                                label="Comisión"
                                                currency={selectedCreditCard?.currency === 'USD' ? 'US$' : '$'}
                                                value={commission}
                                                onChange={(value) => setCommission(value)}
                                                required={isIncomeByCredit}
                                                placeholder="0,00"
                                            />
                                            <input type="hidden" name="commission" value={commission} />
                                            <p className="text-[10px] text-white/40 ml-1 mt-1 italic">
                                                Diferencia entre el monto recibido y el cargo en la tarjeta
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Bottom Section: Destination Account */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Cuenta / Destino</label>
                            </div>

                            {isIncomeByCredit ? (
                                // Solo Astropay para Ingreso por crédito
                                <div className="grid grid-cols-1 gap-4 p-5 bg-emerald-500/10 border border-emerald-400/20 rounded-2xl">
                                    <div className="p-3 bg-white/5 rounded-xl border border-emerald-400/20">
                                        <p className="text-xs font-bold text-emerald-400 mb-1">📱 Astropay</p>
                                        <p className="text-[10px] text-white/50">Los fondos ingresarán a una cuenta de Astropay</p>
                                    </div>
                                    <Select
                                        name="productId"
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        required
                                    >
                                        <option value="" className="bg-slate-800">Seleccionar cuenta de Astropay...</option>
                                        {astropayProducts.map(product => (
                                            <option key={product.id} value={product.id} className="bg-slate-800">
                                                {product.name} ({product.currency})
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            ) : (
                                // Todas las instituciones para ingresos normales
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-emerald-500/10 border border-emerald-400/20 rounded-2xl">
                                    <Select
                                        value={selectedInstitutionId}
                                        onChange={(e) => setSelectedInstitutionId(e.target.value)}
                                    >
                                        <option value="" className="bg-slate-800">Seleccionar Institución...</option>
                                        <option value="CASH" className="bg-slate-800">💵 Efectivo</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id} className="bg-slate-800">
                                                {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                            </option>
                                        ))}
                                    </Select>

                                    <Select
                                        name="productId"
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        required
                                        disabled={!selectedInstitutionId}
                                    >
                                        <option value="" className="bg-slate-800">
                                            {!selectedInstitutionId
                                                ? 'Primero seleccione institución'
                                                : 'Seleccionar cuenta...'}
                                        </option>
                                        {availableProducts.map(product => (
                                            <option key={product.id} value={product.id} className="bg-slate-800">
                                                {product.name} ({product.currency})
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit p-3 rounded-xl hover:bg-white/5 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={keepOpen}
                                    onChange={(e) => setKeepOpen(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-white/30 bg-transparent text-emerald-500 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer transition-all"
                                />
                                <span className="text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors">
                                    Seguir cargando (mantener formulario)
                                </span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsOpen(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                loading={isLoading}
                                className="flex-[2]"
                                icon={<span className="material-symbols-outlined">check_circle</span>}
                            >
                                {keepOpen ? 'Guardar y Seguir' : 'Guardar Ingreso'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
