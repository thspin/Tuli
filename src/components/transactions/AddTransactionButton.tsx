'use client'

import { useState, useEffect } from 'react';
import { createTransaction } from '@/src/actions/transactions/transaction-actions';
import { getCategories } from '@/src/actions/categories/category-actions';
import { Product, InstitutionWithProducts } from '@/src/types';
import { Modal, Input, Select, Button, MoneyInput } from '@/src/components/ui';
import { getTodayInBuenosAires } from '@/src/utils/date';

interface AddTransactionButtonProps {
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    type?: 'EXPENSE' | 'INCOME';
    variant?: 'default' | 'cardAction';
}

export default function AddTransactionButton({ institutions, cashProducts, type = 'EXPENSE', variant = 'default' }: AddTransactionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Selection state
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    // Categories state
    const [categories, setCategories] = useState<any[]>([]);

    // Hydration fix: Date state
    const [dateValue, setDateValue] = useState('');

    // Transaction details state
    const [amount, setAmount] = useState('');
    const [installments, setInstallments] = useState(1);
    const [installmentAmount, setInstallmentAmount] = useState('');
    const [isPlanZ, setIsPlanZ] = useState(false);

    // New state
    const [keepOpen, setKeepOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        // Set default date only on client to avoid hydration mismatch
        setDateValue(getTodayInBuenosAires());
    }, []);

    // Load categories when modal opens
    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    const loadCategories = async () => {
        const result = await getCategories(type);
        if (result.success) {
            setCategories(result.categories || []);
        }
    };

    // Filter products based on selected institution
    const availableProducts = selectedInstitutionId === 'CASH'
        ? cashProducts
        : selectedInstitutionId
            ? institutions.find(i => i.id === selectedInstitutionId)?.products || []
            : [];

    // Reset product when institution changes
    useEffect(() => {
        setSelectedProductId('');
    }, [selectedInstitutionId]);

    const selectedProduct = availableProducts.find(p => p.id === selectedProductId);
    const isCreditCard = selectedProduct?.type === 'CREDIT_CARD';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        const form = e.currentTarget;
        const formData = new FormData(form);
        if (installmentAmount) {
            formData.set('installmentAmount', installmentAmount);
        }
        formData.set('type', type);

        try {
            const result = await createTransaction(formData);

            if (result.success) {
                if (keepOpen) {
                    setSuccessMessage('¡Egreso guardado! Puedes seguir cargando.');
                    // Only clear amount to prevent accidental double submission, keep everything else
                    setAmount('');
                    setInstallmentAmount('');
                    // Focus logic could go here if we had refs
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    setIsOpen(false);
                    form.reset();
                    setSelectedInstitutionId('');
                    setSelectedProductId('');
                    setAmount('');
                    setDescription('');
                    setInstallments(1);
                    setInstallmentAmount('');
                    setDateValue(getTodayInBuenosAires());
                }
            } else {
                setError(result.error || 'Error desconocido');
            }
        } catch (err) {
            console.error('Client submission error:', err);
            setError(`Error al procesar la solicitud: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {variant === 'cardAction' ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 py-6 hover:bg-white/5 transition-all group rounded-2xl"
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border
                        ${type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 group-hover:bg-rose-500 group-hover:text-white'}
                    `}>
                        <span className="material-symbols-outlined text-[22px]">{type === 'INCOME' ? 'add' : 'remove'}</span>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-medium">{type === 'INCOME' ? 'Ingreso' : 'Gasto'}</p>
                        <p className="text-white/50 text-xs">{type === 'INCOME' ? 'Registrar' : 'Registrar'}</p>
                    </div>
                </button>
            ) : (
                <Button onClick={() => setIsOpen(true)} variant={type === 'INCOME' ? 'primary' : 'danger'} size="sm" icon={<span className="material-symbols-outlined text-[20px]">{type === 'INCOME' ? 'add' : 'payments'}</span>}>
                    {type === 'INCOME' ? 'Agregar Ingreso' : 'Agregar Egreso'}
                </Button>
            )}

            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    size="md"
                    title={type === 'INCOME' ? 'Registrar Ingreso' : 'Agregar Egreso'}
                    description={type === 'INCOME' ? 'Registra un ingreso de dinero' : 'Registra un egreso de dinero'}
                    icon={<span className="material-symbols-outlined text-[24px]">{type === 'INCOME' ? 'add_circle' : 'payments'}</span>}
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Row 1: Amount (Main focus) */}
                        <div>
                            <MoneyInput
                                label="Monto *"
                                currency={selectedProduct?.currency === 'USD' ? 'US$' : '$'}
                                value={amount}
                                onChange={(value) => {
                                    setAmount(value);
                                    if (installments > 1 && value) {
                                        setInstallmentAmount((parseFloat(value) / installments).toFixed(2));
                                    }
                                }}
                                required
                                placeholder="0,00"
                            />
                            <input type="hidden" name="amount" value={amount} />
                        </div>

                        {/* Row 2: Date */}
                        <Input
                            type="date"
                            label="Fecha de operación *"
                            name="date"
                            required
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                        />

                        {/* Origin selection simplified layout */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)] ${type === 'INCOME' ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-blue-400 shadow-blue-400/50'}`} />
                                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider">{type === 'INCOME' ? 'Cuenta / Destino *' : 'Cuenta / Origen *'}</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl">
                                <Select
                                    value={selectedInstitutionId}
                                    onChange={(e) => setSelectedInstitutionId(e.target.value)}
                                >
                                    <option value="" className="bg-slate-800">Seleccionar institución...</option>
                                    <option value="CASH" className="bg-slate-800">💵 Efectivo</option>
                                    {institutions.map(inst => (
                                        <option key={inst.id} value={inst.id} className="bg-slate-800">
                                            {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                        </option>
                                    ))}
                                </Select>

                                <Select
                                    name="fromProductId"
                                    required
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    disabled={!selectedInstitutionId}
                                >
                                    <option value="" className="bg-slate-800">
                                        {!selectedInstitutionId
                                            ? 'Seleccione institución primero'
                                            : 'Seleccionar una cuenta...'}
                                    </option>
                                    {availableProducts.map(product => (
                                        <option key={product.id} value={product.id} className="bg-slate-800">
                                            {product.name} ({product.currency})
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Row 4: Category and Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Categoría"
                                name="categoryId"
                            >
                                <option value="">Seleccionar categoría...</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.icon ? `${category.icon} ` : ''}{category.name}
                                    </option>
                                ))}
                            </Select>

                            <Input
                                type="text"
                                label="Descripción *"
                                name="description"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Supermercado, Nafta"
                            />
                        </div>

                        {isCreditCard && (
                            <div className="p-6 bg-blue-500/10 border border-blue-400/20 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-400">credit_card</span>
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Detalles de financiación</span>
                                    </div>

                                    {/* Plan Z Toggle - Only for Naranja cards */}
                                    {selectedProduct?.name?.toUpperCase().includes('NARANJA') && (
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider group-hover:text-orange-300 transition-colors">
                                                Plan Z
                                            </span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    name="planZ"
                                                    className="peer sr-only"
                                                    checked={isPlanZ}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setIsPlanZ(checked);
                                                        if (checked) {
                                                            setInstallments(1);
                                                            if (amount) setInstallmentAmount(amount);
                                                        }
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                {!isPlanZ ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            type="number"
                                            label="Cuotas"
                                            name="installments"
                                            min="1"
                                            max="36"
                                            value={installments}
                                            onChange={(e) => {
                                                const newInstallments = parseInt(e.target.value) || 1;
                                                const clampedInstallments = Math.max(1, Math.min(36, newInstallments));
                                                setInstallments(clampedInstallments);
                                                if (amount) {
                                                    setInstallmentAmount((parseFloat(amount) / clampedInstallments).toFixed(2));
                                                }
                                            }}
                                        />
                                        {installments > 1 && (
                                            <div>
                                                <MoneyInput
                                                    label="Valor de cada cuota"
                                                    currency={selectedProduct?.currency === 'USD' ? 'US$' : '$'}
                                                    value={installmentAmount}
                                                    onChange={(value) => setInstallmentAmount(value)}
                                                    placeholder="0,00"
                                                />
                                                <input type="hidden" name="installmentAmount" value={installmentAmount} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-orange-500/10 border border-orange-400/20 rounded-2xl flex items-start gap-3">
                                        <span className="material-symbols-outlined text-orange-400 mt-0.5">info</span>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-orange-300">Plan Z Activado</p>
                                            <p className="text-xs text-orange-200/70 leading-relaxed">
                                                Esta compra se registrará como un pago único. Podrás financiarla en 3 cuotas sin interés al pagar el resumen.
                                            </p>
                                            <input type="hidden" name="installments" value="1" />
                                        </div>
                                    </div>
                                )}

                                {installments > 1 && !isPlanZ && amount && installmentAmount && (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/50">Total financiado:</span>
                                            <span className="font-bold text-white">
                                                ${(parseFloat(installmentAmount) * installments).toFixed(2)}
                                            </span>
                                        </div>
                                        {(parseFloat(installmentAmount) * installments) > parseFloat(amount) && (
                                            <div className="flex justify-between text-xs text-orange-400">
                                                <span>Interés total:</span>
                                                <span className="font-bold">
                                                    +${((parseFloat(installmentAmount) * installments) - parseFloat(amount)).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions Section */}
                        <div className="border-t border-white/10 pt-5 mt-2 space-y-4">
                            {/* Keep open checkbox */}
                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={keepOpen}
                                        onChange={(e) => setKeepOpen(e.target.checked)}
                                        className="peer w-5 h-5 rounded-md border-2 border-white/30 bg-transparent text-blue-500 focus:ring-blue-500/30 cursor-pointer transition-colors checked:border-blue-500 checked:bg-blue-500"
                                    />
                                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors">
                                    Seguir cargando (mantener formulario)
                                </span>
                            </label>

                            {/* Buttons */}
                            <div className="flex gap-4">
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
                                    variant={type === 'INCOME' ? 'primary' : 'danger'}
                                    loading={isSubmitting}
                                    className="flex-[2]"
                                    icon={<span className="material-symbols-outlined">check_circle</span>}
                                >
                                    {keepOpen ? 'Guardar y Seguir' : (type === 'INCOME' ? 'Guardar Ingreso' : 'Guardar Egreso')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
