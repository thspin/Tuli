'use client'

import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from './actions';

interface Category {
    id: string;
    name: string;
    icon: string | null;
    categoryType: 'INCOME' | 'EXPENSE';
    isSystem: boolean;
}

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

    const commonEmojis = ['🏷️', '🛒', '🍽️', '🚗', '🏠', '💊', '✈️', '🎮', '🎓', '🎁', '💰', '💼', '🏦', '📈'];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Navigation */}
                <div className="mb-6 flex gap-3">
                    <a
                        href="/"
                        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-gray-200"
                    >
                        ← Inicio
                    </a>
                    <a
                        href="/accounts"
                        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-gray-200"
                    >
                        📊 Mis Cuentas
                    </a>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        ➕ Nueva Categoría
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm p-1 mb-6 inline-flex">
                    <button
                        onClick={() => setActiveTab('EXPENSE')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'EXPENSE'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        💸 Egresos
                    </button>
                    <button
                        onClick={() => setActiveTab('INCOME')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'INCOME'
                                ? 'bg-green-100 text-green-700'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        💰 Ingresos
                    </button>
                </div>

                {/* List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Cargando categorías...</div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No hay categorías de {activeTab === 'INCOME' ? 'ingresos' : 'egresos'} creadas.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {categories.map((category) => (
                                <div key={category.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{category.icon || '🏷️'}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{category.name}</p>
                                            {category.isSystem && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                    Sistema
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!category.isSystem && (
                                            <>
                                                <button
                                                    onClick={() => handleOpenModal(category)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Supermercado"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Icono
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-16 p-3 border border-gray-300 rounded-lg text-center text-xl"
                                            maxLength={2}
                                        />
                                        <div className="flex-1 flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                                            {commonEmojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, icon: emoji })}
                                                    className="hover:bg-gray-200 p-1 rounded text-xl transition-colors"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
