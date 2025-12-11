'use client'

import { useState, useEffect } from 'react';
import { updateTransaction, deleteTransaction } from '@/src/actions/transactions/transaction-actions';
import { getCategories } from '@/src/actions/categories/category-actions';
import { Modal, Input, Select, Button } from '@/src/components/ui';

interface Transaction {
    id: string;
    amount: number;
    date: Date | string;
    description: string;
    type: string;
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
    const [dateValue, setDateValue] = useState(
        new Date(transaction.date).toISOString().split('T')[0]
    );
    const [categoryId, setCategoryId] = useState(transaction.category?.id || '');

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
        setDateValue(new Date(transaction.date).toISOString().split('T')[0]);
        setCategoryId(transaction.category?.id || '');
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Transacción" size="md">
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {showDeleteConfirm ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300 font-medium mb-2">
                            ⚠️ ¿Estás seguro de eliminar esta transacción?
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>{transaction.description}</strong><br />
                            Monto: ${Math.abs(transaction.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                        {isInstallment && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                                ⚠️ Esta es la cuota {transaction.installmentNumber}/{transaction.installmentTotal}.
                                Solo se eliminará esta cuota, no las demás.
                            </p>
                        )}
                        <p className="text-xs text-red-500 mt-2">
                            Esta acción revertirá los cambios de balance y no se puede deshacer.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Transaction Info */}
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{isTransfer ? '🔄' : transaction.type === 'INCOME' ? '💰' : '💸'}</span>
                            <span className="font-medium">
                                {isTransfer ? 'Transferencia' : transaction.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                            </span>
                            {product && (
                                <>
                                    <span>•</span>
                                    <span>{product.name}</span>
                                </>
                            )}
                        </div>
                        {isInstallment && (
                            <p className="text-xs text-blue-500 mt-1">
                                Cuota {transaction.installmentNumber}/{transaction.installmentTotal}
                            </p>
                        )}
                    </div>

                    <Input
                        type="date"
                        label="Fecha"
                        value={dateValue}
                        onChange={(e) => setDateValue(e.target.value)}
                        required
                    />

                    <Input
                        type="text"
                        label="Descripción"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg font-medium transition-colors text-sm"
                        >
                            🗑️ Eliminar
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
