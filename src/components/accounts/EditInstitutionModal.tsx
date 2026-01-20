'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateInstitution, deleteInstitution } from '@/src/actions/accounts/account-actions';
import { Modal, Input, Select } from '@/src/components/ui';
import { InstitutionWithProducts } from '@/src/types';

interface EditInstitutionModalProps {
    institution: InstitutionWithProducts;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function EditInstitutionModal({
    institution,
    isOpen,
    onClose,
    onSuccess
}: EditInstitutionModalProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState(institution.name);
    const [type, setType] = useState(institution.type);
    const [shareSummary, setShareSummary] = useState(institution.shareSummary || false);

    // Reset form when institution changes
    useEffect(() => {
        setName(institution.name);
        setName(institution.name);
        setType(institution.type);
        setShareSummary(institution.shareSummary || false);
        setShowDeleteConfirm(false);
        setError(null);
    }, [institution]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.set('name', name);
        formData.set('type', type);
        formData.set('shareSummary', String(shareSummary));

        try {
            const result = await updateInstitution(institution.id, formData);

            if (result.success) {
                onSuccess?.();
                router.refresh();
                onClose();
            } else {
                setError(result.error || 'Error al actualizar la institución');
            }
        } catch (err) {
            setError('Error al actualizar la institución');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const result = await deleteInstitution(institution.id);

            if (result.success) {
                onSuccess?.();
                router.refresh();
                onClose();
            } else {
                setError(result.error || 'Error al eliminar la institución');
            }
        } catch (err) {
            setError('Error al eliminar la institución');
        } finally {
            setIsDeleting(false);
        }
    };

    const hasProducts = institution.products.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Institución" size="sm">
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {showDeleteConfirm ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300 font-medium mb-2">
                            ⚠️ ¿Estás seguro de eliminar esta institución?
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>{institution.type === 'BANK' ? '🏦' : '📱'} {institution.name}</strong>
                        </p>
                        {hasProducts ? (
                            <p className="text-xs text-red-500 mt-2">
                                ⚠️ Esta institución tiene {institution.products.length} producto(s).
                                Debes eliminar todos los productos antes de eliminar la institución.
                            </p>
                        ) : (
                            <p className="text-xs text-red-500 mt-2">
                                Esta acción no se puede deshacer.
                            </p>
                        )}
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
                            disabled={isDeleting || hasProducts}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'Eliminando...' : hasProducts ? 'No disponible' : 'Sí, Eliminar'}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Institution Info */}
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {institution.type === 'BANK' ? '🏦 Banco' : '📱 Billetera'}
                            </span>
                            {' • '}
                            {institution.products.length} producto(s)
                        </p>
                    </div>

                    <Input
                        type="text"
                        label="Nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Ej: Banco Galicia, Mercado Pago"
                    />

                    <Select
                        label="Tipo de Institución"
                        value={type}
                        onChange={(e) => setType(e.target.value as 'BANK' | 'WALLET')}
                        required
                    >
                        <option value="BANK">🏦 Banco</option>
                        <option value="WALLET">📱 Billetera Virtual</option>
                    </Select>

                    {/* Share Summary Switch */}
                    {type === 'BANK' && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">Resumen Unificado</h4>
                                <p className="text-xs text-slate-500">
                                    Todas las tarjetas comparten el mismo resumen
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={shareSummary}
                                    onChange={(e) => setShareSummary(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
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
