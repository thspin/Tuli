'use client'

import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/src/actions/categories/category-actions';
import { Category, COMMON_CATEGORY_EMOJIS } from '@/src/types';
import { Modal, Input, Button } from '@/src/components/ui';

interface CategoryManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CategoryManagementModal({ isOpen, onClose }: CategoryManagementModalProps) {
    const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states for create/edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        icon: '🏷️',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [activeTab, isOpen]);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const result = await getCategories(activeTab);
            if (result.success) {
                setCategories(result.categories as Category[]);
            } else {
                setError(result.error || 'Error al cargar categorías');
            }
        } catch (err) {
            setError('Error al cargar categorías');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEditModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                icon: category.icon || '🏷️',
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                icon: '🏷️',
            });
        }
        setIsEditModalOpen(true);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('icon', formData.icon);
        data.append('categoryType', activeTab);

        try {
            let result;
            if (editingCategory) {
                result = await updateCategory(editingCategory.id, data);
            } else {
                result = await createCategory(data);
            }

            if (result.success) {
                setIsEditModalOpen(false);
                loadCategories();
            } else {
                setError(result.error || 'Error al guardar categoría');
            }
        } catch (err) {
            setError('Error al guardar categoría');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

        try {
            const result = await deleteCategory(id);
            if (result.success) {
                loadCategories();
            } else {
                alert(result.error || 'Error al eliminar categoría');
            }
        } catch (err) {
            alert('Error al eliminar categoría');
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Gestión de Categorías"
                description="Organiza tus transacciones por categoría"
                icon={<span className="material-symbols-outlined">category</span>}
                size="md"
            >
                <div className="space-y-6">
                    {/* Header with Tabs and Add Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="bg-background border border-border rounded-2xl p-1 inline-flex w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab('EXPENSE')}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'EXPENSE'
                                    ? 'bg-card text-red-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                💸 Egresos
                            </button>
                            <button
                                onClick={() => setActiveTab('INCOME')}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'INCOME'
                                    ? 'bg-card text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                💰 Ingresos
                            </button>
                        </div>
                        <Button
                            onClick={() => handleOpenEditModal()}
                            variant="primary"
                            size="sm"
                            icon={<span className="material-symbols-outlined">add</span>}
                            className="w-full sm:w-auto"
                        >
                            Nueva Categoría
                        </Button>
                    </div>

                    {/* Categories List */}
                    <div className="bg-background border border-border rounded-[28px] overflow-hidden max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-400 font-medium">Cargando categorías...</div>
                        ) : categories.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-medium">
                                No hay categorías de {activeTab === 'INCOME' ? 'ingresos' : 'egresos'} creadas.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {categories.map((category) => (
                                    <div key={category.id} className="p-4 flex items-center justify-between hover:bg-card transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-2xl shadow-sm">
                                                {category.icon || '🏷️'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{category.name}</p>
                                                {category.isSystem && (
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter bg-card border border-border text-slate-400 px-2 py-0.5 rounded-lg mt-1 inline-block">
                                                        Sistema
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!category.isSystem && (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenEditModal(category)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-slate-400 hover:text-blue-500 hover:border-blue-100 hover:bg-blue-50 transition-all"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category.id)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Edit/Create Category Modal */}
            {isEditModalOpen && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                    description={editingCategory ? 'Personaliza los detalles de la categoría' : 'Crea una nueva categoría para tus gastos'}
                    icon={<span className="material-symbols-outlined">edit_note</span>}
                    size="sm"
                >
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                            <span className="material-symbols-outlined text-[20px]">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Nombre"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Supermercado"
                            required
                        />

                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Icono / Emoji
                            </label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-20 h-20 bg-background border border-border rounded-[28px] text-center text-3xl focus:ring-4 focus:ring-slate-200/50 focus:border-slate-400/50 transition-all"
                                    maxLength={2}
                                />
                                <div className="flex-1 flex flex-wrap gap-2 p-4 bg-background border border-border rounded-[28px] max-h-40 overflow-y-auto">
                                    {COMMON_CATEGORY_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: emoji })}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-card hover:shadow-sm transition-all hover:scale-110 text-xl"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isSaving}
                                className="flex-1"
                                icon={<span className="material-symbols-outlined">save</span>}
                            >
                                Guardar
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
