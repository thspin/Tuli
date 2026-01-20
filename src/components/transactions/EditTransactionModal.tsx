'use client'

import { useState, useEffect } from 'react';
import { updateTransaction, deleteTransaction } from '@/src/actions/transactions/transaction-actions';
import { getCategories } from '@/src/actions/categories/category-actions';
import { Modal, Input, Select, Button } from '@/src/components/ui';
import { toISODate } from '@/src/utils/date';

interface Transaction {
    id: string;
    amount: number;
    date: Date | string;
    description: string;
    type: string;
    planZ?: boolean | null;
    installmentNumber?: number | null;
    installmentTotal?: number | null;
    category?: {
        id: string;
        name: string;
        icon: string | null;
    } | null;
    fromProduct?: {
        id: string;
        name: string;
        currency: string;
        type: string;
        institution: {
            id: string;
            name: string;
            type: string;
        };
    } | null;
    toProduct?: {
        id: string;
        name: string;
        currency: string;
        type: string;
        institution: {
            id: string;
            name: string;
            type: string;
        };
    } | null;
}

interface EditTransactionModalProps {
    transaction: Transaction;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function EditTransactionModal({
    transaction,
    isOpen,
    onClose,
    onSuccess
}: EditTransactionModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    // Form state
    const [description, setDescription] = useState(transaction.description);
    const [amount, setAmount] = useState(String(transaction.amount));
    const [dateValue, setDateValue] = useState(toISODate(transaction.date));
    const [categoryId, setCategoryId] = useState(transaction.category?.id || '');
    const [isPlanZ, setIsPlanZ] = useState(transaction.planZ || false);

    // Load categories
    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    // Reset form when transaction changes
    useEffect(() => {
        setDescription(transaction.description);
        setAmount(String(transaction.amount));
        setDateValue(toISODate(transaction.date));
        setCategoryId(transaction.category?.id || '');
        setIsPlanZ(transaction.planZ || false);
        setShowDeleteConfirm(false);
        setError(null);
    }, [transaction]);

    const loadCategories = async () => {
        const type = transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
        const result = await getCategories(type);
        if (result.success) {
            setCategories(result.categories || []);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.set('description', description);
        formData.set('amount', amount);
        formData.set('date', dateValue);
        formData.set('categoryId', categoryId);
        if (isPlanZ) formData.set('planZ', 'true');
        else formData.set('planZ', 'false');

        try {
            const result = await updateTransaction(transaction.id, formData);

            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(result.error || 'Error al actualizar la transacción');
            }
        } catch (err) {
            setError('Error al actualizar la transacción');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const result = await deleteTransaction(transaction.id);

            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(result.error || 'Error al eliminar la transacción');
            }
        } catch (err) {
            setError('Error al eliminar la transacción');
        } finally {
            setIsDeleting(false);
        }
    };

    const product = transaction.fromProduct || transaction.toProduct;
    const isTransfer = transaction.type === 'TRANSFER';
    const isInstallment = transaction.installmentNumber && transaction.installmentTotal;
    const isNaranja = product?.name?.toLowerCase().includes('naranja');
    const canBePlanZ = isNaranja && (!transaction.installmentTotal || transaction.installmentTotal === 1);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalles de Transacción"
            description="Actualiza o elimina la transacción seleccionada"
            icon={<span className="material-symbols-outlined">receipt_long</span>}
            size="md"
        >
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-shake">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    {error}
                </div>
            )}

            {showDeleteConfirm ? (
                <div className="space-y-6">
                    <div className="p-6 bg-red-50 border border-red-100 rounded-[28px] space-y-4">
                        <div className="flex items-center gap-3 text-red-600 font-bold uppercase tracking-wider text-xs">
                            <span className="material-symbols-outlined">warning</span>
                            ¿Confirmar eliminación?
                        </div>
                        <div>
                            <p className="text-slate-900 font-bold text-lg">{transaction.description}</p>
                            <p className="text-red-600 font-bold">
                                {transaction.amount < 0 ? '-' : ''}
                                ${Math.abs(transaction.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            * Esta acción revertirá los cambios en el balance de {product?.name}
                        </p>
                        {isInstallment && (
                            <div className="p-3 bg-white/50 rounded-xl border border-red-100 text-[10px] text-red-500 font-bold uppercase">
                                ⚠️ Cuota {transaction.installmentNumber}/{transaction.installmentTotal}. Solo se eliminará esta cuota.
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => setShowDeleteConfirm(false)}
                            variant="secondary"
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            variant="danger"
                            loading={isDeleting}
                            className="flex-1"
                            icon={<span className="material-symbols-outlined">delete_forever</span>}
                        >
                            Sí, Eliminar
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Header Info Banner */}
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isTransfer ? 'bg-blue-600 shadow-blue-100' :
                                transaction.type === 'INCOME' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-red-500 shadow-red-100'
                                }`}>
                                <span className="material-symbols-outlined">
                                    {isTransfer ? 'sync_alt' : transaction.type === 'INCOME' ? 'add_card' : 'payments'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {isTransfer ? 'Transferencia' : transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                </p>
                                <p className="font-bold text-slate-900">{product?.name || 'Desconocido'}</p>
                            </div>
                        </div>
                        {isInstallment && (
                            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-tight">
                                Cuota {transaction.installmentNumber}/{transaction.installmentTotal}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            type="date"
                            label="Fecha de operación"
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                            required
                        />
                        <Input
                            type="number"
                            label="Monto"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    {canBePlanZ && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-orange-600">credit_score</span>
                                <div>
                                    <p className="text-sm font-bold text-orange-900">Plan Z</p>
                                    <p className="text-xs text-orange-700">Se financiará en el resumen</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPlanZ}
                                    onChange={(e) => setIsPlanZ(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-orange-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    )}

                    <Input
                        type="text"
                        label="Descripción detallada"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        placeholder="Ej: Pago de servicios..."
                    />

                    {!isTransfer && (
                        <Select
                            label="Categoría"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="">Sin categoría</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.icon ? `${category.icon} ` : ''}{category.name}
                                </option>
                            ))}
                        </Select>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-6"
                            icon={<span className="material-symbols-outlined">delete</span>}
                        >
                            Eliminar
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cerrar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isSubmitting}
                            className="flex-[2]"
                            icon={<span className="material-symbols-outlined">save</span>}
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}


