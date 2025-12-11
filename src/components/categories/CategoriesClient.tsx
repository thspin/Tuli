'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/src/actions/categories/category-actions';
import { Category, COMMON_CATEGORY_EMOJIS } from '@/src/types';
import { Modal, Input, Button } from '@/src/components/ui';
import ThemeSwitcher from '../ui/ThemeSwitcher';

export default function CategoriesClient() {
    const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        icon: '🏷️',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadCategories();
    }, [activeTab]);

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

    const handleOpenModal = (category?: Category) => {
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
        setIsModalOpen(true);
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
                setIsModalOpen(false);
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
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Navigation */}
                <div className="mb-6 flex gap-3 justify-between items-center">
                    <div className="flex gap-3">
                        <Link
                            href="/"
                            className="bg-card hover:bg-accent text-card-foreground px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-border"
                        >
                            ← Inicio
                        </Link>
                        <Link
                            href="/accounts"
                            className="bg-card hover:bg-accent text-card-foreground px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-border"
                        >
                            📊 Mis Cuentas
                        </Link>
                    </div>
                    <ThemeSwitcher />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Gestión de Categorías</h1>
                        <p className="text-muted-foreground">Organiza tus transacciones por categoría</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
                    >
                        ➕ Nueva Categoría
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-1.5 mb-6 inline-flex">
                    <button
                        onClick={() => setActiveTab('EXPENSE')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'EXPENSE'
                                ? 'bg-destructive/10 text-destructive'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        💸 Egresos
                    </button>
                    <button
                        onClick={() => setActiveTab('INCOME')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'INCOME'
                                ? 'bg-success/10 text-success'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        💰 Ingresos
                    </button>
                </div>

                {/* List */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando categorías...</div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No hay categorías de {activeTab === 'INCOME' ? 'ingresos' : 'egresos'} creadas.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {categories.map((category) => (
                                <div key={category.id} className="p-5 flex items-center justify-between hover:bg-accent transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{category.icon || '🏷️'}</span>
                                        <div>
                                            <p className="font-semibold text-foreground">{category.name}</p>
                                            {category.isSystem && (
                                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full mt-1 inline-block">
                                                    Sistema
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!category.isSystem && (
                                            <>
                                                <button
                                                    onClick={() => handleOpenModal(category)}
                                                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                    >
                        {error && (
                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Nombre"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Supermercado"
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Icono
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-16 p-3 border border-border bg-background text-foreground rounded-xl text-center text-xl transition-all focus:ring-2 focus:ring-primary"
                                        maxLength={2}
                                    />
                                    <div className="flex-1 flex flex-wrap gap-2 p-3 bg-muted rounded-xl max-h-32 overflow-y-auto">
                                        {COMMON_CATEGORY_EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: emoji })}
                                                className="hover:bg-background p-2 rounded-lg text-xl transition-colors hover:scale-110 transform"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    loading={isSaving}
                                    className="flex-1"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        </div>
    );
}
