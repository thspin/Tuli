'use client'

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'
import AddTransactionButton from './AddTransactionButton';
import AddIncomeButton from '../accounts/AddIncomeButton';
import AddTransferButton from '../accounts/AddTransferButton';
import EditTransactionModal from './EditTransactionModal';
import CategoryManagementModal from '../categories/CategoryManagementModal';

import { InstitutionWithProducts, Product, Category } from '@/src/types';
import { Button } from '@/src/components/ui';
import { formatDate } from '@/src/utils/date';

interface Transaction {
    id: string;
    amount: number;
    date: Date | string;
    description: string;
    type: string;
    installmentNumber?: number | null;
    installmentTotal?: number | null;
    planZ?: boolean | null;
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

interface TransactionsClientProps {
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    initialTransactions: Transaction[];
    categories: Category[];
}

type SortField = 'date' | 'amount' | 'description';
type SortOrder = 'asc' | 'desc';

export default function TransactionsClient({
    institutions,
    cashProducts,
    initialTransactions,
    categories
}: TransactionsClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterInstitutionId, setFilterInstitutionId] = useState<string>('');
    const [filterProductId, setFilterProductId] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [filterCategoryId, setFilterCategoryId] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const allProducts = useMemo(() => {
        const institutionProducts = institutions.flatMap(inst =>
            inst.products.map(p => ({ ...p, institution: { id: inst.id, name: inst.name, type: inst.type } }))
        );
        const cashProductsWithInstitution = cashProducts.map(p => ({
            ...p,
            institution: { id: 'CASH', name: 'Efectivo', type: 'CASH' as const }
        }));
        return [...institutionProducts, ...cashProductsWithInstitution];
    }, [institutions, cashProducts]);

    const availableProducts = useMemo(() => {
        if (!filterInstitutionId) return allProducts;
        if (filterInstitutionId === 'CASH') return cashProducts;
        const institution = institutions.find(i => i.id === filterInstitutionId);
        return institution?.products.map(p => ({
            ...p,
            institution: { id: institution.id, name: institution.name, type: institution.type }
        })) || [];
    }, [filterInstitutionId, institutions, cashProducts, allProducts]);

    const availableCategories = useMemo(() => {
        if (!filterType || filterType === 'TRANSFER') return categories;
        return categories.filter((cat: Category) => cat.categoryType === filterType);
    }, [filterType, categories]);

    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = [...initialTransactions];

        if (filterInstitutionId) {
            filtered = filtered.filter(t => {
                const fromInstitutionId = filterInstitutionId === 'CASH' ? 'CASH' : t.fromProduct?.institution?.id;
                const toInstitutionId = t.toProduct?.institution?.id;
                return fromInstitutionId === filterInstitutionId || toInstitutionId === filterInstitutionId;
            });
        }

        if (filterProductId) {
            filtered = filtered.filter(t => t.fromProduct?.id === filterProductId || t.toProduct?.id === filterProductId);
        }

        if (filterStartDate) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(filterStartDate));
        }
        if (filterEndDate) {
            const endDate = new Date(filterEndDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.date) <= endDate);
        }

        if (filterCategoryId) {
            if (filterCategoryId === 'NONE') {
                filtered = filtered.filter(t => !t.category);
            } else {
                filtered = filtered.filter(t => t.category?.id === filterCategoryId);
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => {
                return t.description.toLowerCase().includes(query) ||
                    t.category?.name.toLowerCase().includes(query) ||
                    t.fromProduct?.name.toLowerCase().includes(query) ||
                    t.fromProduct?.institution?.name.toLowerCase().includes(query) ||
                    t.toProduct?.name.toLowerCase().includes(query) ||
                    t.toProduct?.institution?.name.toLowerCase().includes(query) ||
                    t.amount.toString().includes(query);
            });
        }

        if (filterType) {
            filtered = filtered.filter(t => t.type === filterType);
        }

        filtered.sort((a, b) => {
            let compareValue = 0;
            switch (sortField) {
                case 'date': compareValue = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
                case 'amount': compareValue = a.amount - b.amount; break;
                case 'description': compareValue = a.description.localeCompare(b.description); break;
            }
            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        return filtered;
    }, [initialTransactions, filterInstitutionId, filterProductId, filterStartDate, filterEndDate, filterCategoryId, filterType, searchQuery, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterInstitutionId('');
        setFilterProductId('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterCategoryId('');
        setFilterType('');
    };

    const hasActiveFilters = searchQuery || filterInstitutionId || filterProductId || filterStartDate || filterEndDate || filterCategoryId || filterType;

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Inicio</span>
                            <span className="text-white/30">/</span>
                            <span className="text-blue-300 text-[10px] uppercase tracking-wider font-semibold">Transacciones</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white glass-text tracking-tight">Transacciones</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <AddTransactionButton institutions={institutions} cashProducts={cashProducts} />
                        <AddIncomeButton institutions={institutions} cashProducts={cashProducts} />
                        <AddTransferButton institutions={institutions} cashProducts={cashProducts} />
                        <Button
                            onClick={() => setIsCategoryModalOpen(true)}
                            variant="glass"
                            size="sm"
                            icon={<span className="material-symbols-outlined text-[20px]">label</span>}
                        >
                            Categorías
                        </Button>
                    </div>
                </div>

                {/* Main Content: Sidebar + Table */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Filters - Glass Card */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="glass-card p-6 sticky top-6">
                            {/* Search Bar */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
                                    Buscar
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[18px]">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar..."
                                        className="w-full pl-11 pr-10 py-3 glass-input rounded-xl text-sm text-white placeholder:text-white/40"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/40 mt-2">
                                    Busca por descripción, categoría, cuenta o monto
                                </p>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full mb-6 px-4 py-2.5 glass-button rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                                    Limpiar filtros
                                </button>
                            )}

                            <div className="space-y-5">
                                {/* Type Filter */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                                        Tipo de transacción
                                    </label>
                                    <select
                                        value={filterType}
                                        onChange={(e) => { setFilterType(e.target.value); setFilterCategoryId(''); }}
                                        className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white"
                                    >
                                        <option value="" className="bg-slate-800">Todos los tipos</option>
                                        <option value="EXPENSE" className="bg-slate-800">💸 Egreso</option>
                                        <option value="INCOME" className="bg-slate-800">💰 Ingreso</option>
                                        <option value="TRANSFER" className="bg-slate-800">🔄 Transferencia</option>
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                                        Categoría
                                    </label>
                                    <select
                                        value={filterCategoryId}
                                        onChange={(e) => setFilterCategoryId(e.target.value)}
                                        className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white"
                                    >
                                        <option value="" className="bg-slate-800">Todas las categorías</option>
                                        <option value="NONE" className="bg-slate-800">🏷️ Sin categoría</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-slate-800">
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Institution Filter */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                                        Institución
                                    </label>
                                    <select
                                        value={filterInstitutionId}
                                        onChange={(e) => { setFilterInstitutionId(e.target.value); setFilterProductId(''); }}
                                        className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white"
                                    >
                                        <option value="" className="bg-slate-800">Todas las instituciones</option>
                                        <option value="CASH" className="bg-slate-800">💵 Efectivo</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id} className="bg-slate-800">
                                                {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Product Filter */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                                        Producto/Cuenta
                                    </label>
                                    <select
                                        value={filterProductId}
                                        onChange={(e) => setFilterProductId(e.target.value)}
                                        disabled={!filterInstitutionId}
                                        className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white disabled:opacity-40"
                                    >
                                        <option value="" className="bg-slate-800">
                                            {filterInstitutionId ? 'Todos los productos' : 'Seleccione institución'}
                                        </option>
                                        {availableProducts.map(product => (
                                            <option key={product.id} value={product.id} className="bg-slate-800">
                                                {product.name} ({product.currency})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                                        Rango de fechas
                                    </label>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] text-white/40 mb-1.5">Desde</label>
                                            <input
                                                type="date"
                                                value={filterStartDate}
                                                onChange={(e) => setFilterStartDate(e.target.value)}
                                                className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-white/40 mb-1.5">Hasta</label>
                                            <input
                                                type="date"
                                                value={filterEndDate}
                                                onChange={(e) => setFilterEndDate(e.target.value)}
                                                className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results count */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-sm text-white/60">
                                    Mostrando <span className="font-bold text-white">{filteredAndSortedTransactions.length}</span> de {initialTransactions.length} transacciones
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Transactions Table - Glass Card */}
                    <div className="flex-1 min-w-0">
                        <div className="glass-card overflow-hidden">
                            {filteredAndSortedTransactions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-4xl text-white/30">inbox</span>
                                    </div>
                                    <p className="text-white/60 font-medium">
                                        {hasActiveFilters
                                            ? 'No hay transacciones que coincidan con los filtros'
                                            : 'No hay transacciones registradas aún'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th
                                                    className="pl-6 pr-4 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
                                                    onClick={() => toggleSort('date')}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Fecha
                                                        {sortField === 'date' && (
                                                            <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="px-4 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
                                                    onClick={() => toggleSort('description')}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Descripción
                                                        {sortField === 'description' && (
                                                            <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="px-4 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                                    Cuenta
                                                </th>
                                                <th className="px-4 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                                    Categoría
                                                </th>
                                                <th className="px-4 py-4 text-center text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                                    Cuotas
                                                </th>
                                                <th
                                                    className="pl-4 pr-6 py-4 text-right text-[10px] font-bold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
                                                    onClick={() => toggleSort('amount')}
                                                >
                                                    <div className="flex items-center justify-end gap-2">
                                                        Monto
                                                        {sortField === 'amount' && (
                                                            <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="px-4 py-4 text-center text-[10px] font-bold text-white/50 uppercase tracking-wider w-16">

                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedTransactions.map((transaction, idx) => {
                                                const isTransfer = transaction.type === 'TRANSFER';
                                                const isRecepción = transaction.description.toLowerCase().includes('recepción');
                                                const displayProduct = (isTransfer && isRecepción && transaction.toProduct)
                                                    ? transaction.toProduct
                                                    : (transaction.fromProduct || transaction.toProduct);
                                                const currency = displayProduct?.currency || 'ARS';
                                                const isExpense = transaction.type === 'EXPENSE';
                                                const isIncome = transaction.type === 'INCOME';
                                                const isCreditCard = transaction.fromProduct?.type === 'CREDIT_CARD';

                                                let amountColor = 'text-white';
                                                let sign = '';
                                                if (isIncome) { amountColor = 'text-emerald-400'; sign = '+'; }
                                                else if (isExpense) {
                                                    if (isCreditCard) { amountColor = 'text-amber-400'; }
                                                    else { amountColor = 'text-red-400'; sign = '-'; }
                                                }
                                                else if (isTransfer) { amountColor = 'text-blue-400'; }

                                                return (
                                                    <tr
                                                        key={transaction.id}
                                                        className={`
                                                            hover:bg-white/5 transition-colors group
                                                            ${idx !== filteredAndSortedTransactions.length - 1 ? 'border-b border-white/5' : ''}
                                                        `}
                                                    >
                                                        <td className="pl-6 pr-4 py-4 whitespace-nowrap">
                                                            <p className="text-sm text-white/60">
                                                                {formatDate(transaction.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-lg">
                                                                        {isTransfer ? '🔄' : transaction.category?.icon || '💸'}
                                                                    </span>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                                                                        {transaction.description}
                                                                    </p>
                                                                    {transaction.installmentNumber && (
                                                                        <p className="text-xs text-white/40 mt-0.5">
                                                                            Cuota {transaction.installmentNumber}/{transaction.installmentTotal}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {isTransfer && transaction.fromProduct && transaction.toProduct ? (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-xs text-white/60">{transaction.fromProduct.name}</span>
                                                                    <span className="text-white/30 text-[10px]">↓</span>
                                                                    <span className="text-xs text-white/60">{transaction.toProduct.name}</span>
                                                                </div>
                                                            ) : displayProduct && (
                                                                <div>
                                                                    <p className="text-sm text-white/70">{displayProduct.name}</p>
                                                                    <p className="text-xs text-white/40">{displayProduct.institution.name}</p>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {isTransfer ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                                    Transferencia
                                                                </span>
                                                            ) : transaction.category ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70 border border-white/10">
                                                                    {transaction.category.name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-white/30">Sin categoría</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-center whitespace-nowrap">
                                                            {transaction.planZ ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                                                    Plan Z
                                                                </span>
                                                            ) : (transaction.installmentTotal && transaction.installmentTotal > 1) ? (
                                                                <span className="text-xs text-white/60">
                                                                    {transaction.installmentNumber}/{transaction.installmentTotal}
                                                                </span>
                                                            ) : (transaction.installmentTotal === 1 || (isExpense && isCreditCard)) ? (
                                                                <span className="text-xs text-white/40">1 cuota</span>
                                                            ) : (
                                                                <span className="text-xs text-white/20">-</span>
                                                            )}
                                                        </td>
                                                        <td className="pl-4 pr-6 py-4 whitespace-nowrap text-right">
                                                            <p className={`text-sm font-bold ${amountColor}`}>
                                                                {sign}{currency === 'ARS' ? '$' : 'US$'} {Math.abs(transaction.amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <button
                                                                onClick={() => { setSelectedTransaction(transaction); setIsEditModalOpen(true); }}
                                                                className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                                title="Editar transacción"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Transaction Modal */}
            {selectedTransaction && (
                <EditTransactionModal
                    transaction={selectedTransaction}
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setSelectedTransaction(null); }}
                    onSuccess={() => router.refresh()}
                />
            )}

            {/* Category Management Modal */}
            <CategoryManagementModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            />
        </div>
    );
}
