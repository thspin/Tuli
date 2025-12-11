'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct, deleteProduct } from '@/src/actions/accounts/account-actions';
import { Modal, Input, Select } from '@/src/components/ui';
import { Product, PRODUCT_TYPE_LABELS, CURRENCY_LABELS, CARD_PROVIDER_LABELS, CardProvider } from '@/src/types';
import { ProductType, Currency } from '@prisma/client';

interface EditProductModalProps {
    product: Product;
    institutionName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function EditProductModal({
    product,
    institutionName,
    isOpen,
    onClose,
    onSuccess
}: EditProductModalProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState(product.name);
    const [balance, setBalance] = useState(String(product.balance));
    const [closingDay, setClosingDay] = useState(product.closingDay?.toString() || '');
    const [dueDay, setDueDay] = useState(product.dueDay?.toString() || '');
    const [limitSinglePayment, setLimitSinglePayment] = useState(product.limitSinglePayment?.toString() || '');
    const [limitInstallments, setLimitInstallments] = useState(product.limitInstallments?.toString() || '');
    const [lastFourDigits, setLastFourDigits] = useState(product.lastFourDigits || '');
    const [provider, setProvider] = useState(product.provider || '');

    const isCredit = product.type === 'CREDIT_CARD';
    const isDebit = product.type === 'DEBIT_CARD';
    const isCard = isCredit || isDebit;

    // Reset form when product changes
    useEffect(() => {
        setName(product.name);
        setBalance(String(product.balance));
        setClosingDay(product.closingDay?.toString() || '');
        setDueDay(product.dueDay?.toString() || '');
        setLimitSinglePayment(product.limitSinglePayment?.toString() || '');
        setLimitInstallments(product.limitInstallments?.toString() || '');
        setLastFourDigits(product.lastFourDigits || '');
        setProvider(product.provider || '');
        setShowDeleteConfirm(false);
        setError(null);
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.set('name', name);
        formData.set('type', product.type);
        formData.set('currency', product.currency);
        formData.set('balance', balance);

        if (isCredit) {
            formData.set('closingDay', closingDay);
            formData.set('dueDay', dueDay);
            formData.set('limitSinglePayment', limitSinglePayment);
            formData.set('limitInstallments', limitInstallments);
            formData.set('provider', provider);
        }

        if (isCard) {
            formData.set('lastFourDigits', lastFourDigits);
        }

        try {
            const result = await updateProduct(product.id, formData);

            if (result.success) {
                onSuccess?.();
                router.refresh();
                onClose();
            } else {
                setError(result.error || 'Error al actualizar el producto');
            }
        } catch (err) {
            setError('Error al actualizar el producto');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const result = await deleteProduct(product.id);

            if (result.success) {
                onSuccess?.();
                router.refresh();
                onClose();
            } else {
                setError(result.error || 'Error al eliminar el producto');
            }
        } catch (err) {
            setError('Error al eliminar el producto');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar ${PRODUCT_TYPE_LABELS[product.type]}`} size="md">
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {showDeleteConfirm ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300 font-medium mb-2">
                            ⚠️ ¿Estás seguro de eliminar este producto?
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>{product.name}</strong><br />
                            Institución: {institutionName}<br />
                            Saldo: ${Math.abs(product.balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-red-500 mt-2">
                            ⚠️ Esto eliminará también TODAS las transacciones asociadas a este producto. Esta acción no se puede deshacer.
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
                    {/* Product Info */}
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">{institutionName}</span>
                            {' • '}
                            {PRODUCT_TYPE_LABELS[product.type]}
                            {' • '}
                            {CURRENCY_LABELS[product.currency as Currency]}
                        </p>
                    </div>

                    <Input
                        type="text"
                        label="Nombre del Producto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <Input
                        type="number"
                        label="Saldo Actual"
                        step="0.01"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        required
                    />

                    {isCard && (
                        <Input
                            type="text"
                            label="Últimos 4 dígitos"
                            maxLength={4}
                            value={lastFourDigits}
                            onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                            placeholder="1234"
                        />
                    )}

                    {isCredit && (
                        <>
                            <Select
                                label="Proveedor"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {Object.entries(CARD_PROVIDER_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </Select>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Día de Cierre"
                                    min="1"
                                    max="31"
                                    value={closingDay}
                                    onChange={(e) => setClosingDay(e.target.value)}
                                />
                                <Input
                                    type="number"
                                    label="Día de Vencimiento"
                                    min="1"
                                    max="31"
                                    value={dueDay}
                                    onChange={(e) => setDueDay(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Límite Compras"
                                    step="0.01"
                                    value={limitSinglePayment}
                                    onChange={(e) => setLimitSinglePayment(e.target.value)}
                                />
                                <Input
                                    type="number"
                                    label="Límite Cuotas"
                                    step="0.01"
                                    value={limitInstallments}
                                    onChange={(e) => setLimitInstallments(e.target.value)}
                                />
                            </div>
                        </>
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
