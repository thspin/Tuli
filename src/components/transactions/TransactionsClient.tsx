'use client'

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'
import AddTransactionButton from './AddTransactionButton';
import AddIncomeButton from '../accounts/AddIncomeButton';
import AddTransferButton from '../accounts/AddTransferButton';
import EditTransactionModal from './EditTransactionModal';
import ThemeSwitcher from '../ui/ThemeSwitcher'
import { InstitutionWithProducts, Product } from '@/src/types';

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

interface TransactionsClientProps {
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    initialTransactions: Transaction[];
}

type SortField = 'date' | 'amount' | 'description';
type SortOrder = 'asc' | 'desc';

export default function TransactionsClient({
    institutions,
    cashProducts,
    initialTransactions
}: TransactionsClientProps) {
    const router = useRouter();
    const [filterInstitutionId, setFilterInstitutionId] = useState<string>('');
    const [filterProductId, setFilterProductId] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Edit modal state
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Get all products (including cash)
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

    // Get products for selected institution
    const availableProducts = useMemo(() => {
        if (!filterInstitutionId) return allProducts;
        if (filterInstitutionId === 'CASH') return cashProducts;
        const institution = institutions.find(i => i.id === filterInstitutionId);
        return institution?.products.map(p => ({
            ...p,
            institution: { id: institution.id, name: institution.name, type: institution.type }
        })) || [];
    }, [filterInstitutionId, institutions, cashProducts, allProducts]);

    // Filter and sort transactions
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = [...initialTransactions];

        // Filter by institution
        if (filterInstitutionId) {
            filtered = filtered.filter(t => {
                const fromInstitutionId = filterInstitutionId === 'CASH'
                    ? 'CASH'
                    : t.fromProduct?.institution?.id;
                const toInstitutionId = t.toProduct?.institution?.id;
                return fromInstitutionId === filterInstitutionId || toInstitutionId === filterInstitutionId;
            });
        }

        // Filter by product
        if (filterProductId) {
            filtered = filtered.filter(t =>
                t.fromProduct?.id === filterProductId || t.toProduct?.id === filterProductId
            );
        }

        // Filter by date range
        if (filterStartDate) {
            filtered = filtered.filter(t => {
                const txDate = new Date(t.date);
                const startDate = new Date(filterStartDate);
                return txDate >= startDate;
            });
        }
        if (filterEndDate) {
            filtered = filtered.filter(t => {
                const txDate = new Date(t.date);
                const endDate = new Date(filterEndDate);
                endDate.setHours(23, 59, 59, 999); // Include entire end date
                return txDate <= endDate;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            let compareValue = 0;

            switch (sortField) {
                case 'date':
                    compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'amount':
                    compareValue = a.amount - b.amount;
                    break;
                case 'description':
                    compareValue = a.description.localeCompare(b.description);
                    break;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        return filtered;
    }, [initialTransactions, filterInstitutionId, filterProductId, filterStartDate, filterEndDate, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const clearFilters = () => {
        setFilterInstitutionId('');
        setFilterProductId('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const hasActiveFilters = filterInstitutionId || filterProductId || filterStartDate || filterEndDate;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                {/* Navigation */}
                <div className="mb-6 flex gap-3 justify-between items-center">
                    <Link
                        href="/"
                        className="bg-card hover:bg-accent text-card-foreground px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-border"
                    >
                        ← Inicio
                    </Link>
                    <ThemeSwitcher />
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">Transacciones</h1>
                    <p className="text-muted-foreground">Registra tus movimientos financieros</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-glow transition-all duration-200 group">
                        <div className="text-4xl mb-1">💸</div>
                        <h2 className="text-lg font-semibold text-card-foreground">Nuevo Gasto</h2>
                        <p className="text-center text-muted-foreground text-xs mb-3">
                            Registra una salida de dinero
                        </p>
                        <div className="w-full">
                            <AddTransactionButton institutions={institutions} cashProducts={cashProducts} />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-glow transition-all duration-200 group">
                        <div className="text-4xl mb-1">💰</div>
                        <h2 className="text-lg font-semibold text-card-foreground">Nuevo Ingreso</h2>
                        <p className="text-center text-muted-foreground text-xs mb-3">
                            Registra una entrada de dinero
                        </p>
                        <div className="w-full">
                            <AddIncomeButton institutions={institutions} cashProducts={cashProducts} />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-glow transition-all duration-200 group">
                        <div className="text-4xl mb-1">🔄</div>
                        <h2 className="text-lg font-semibold text-card-foreground">Transferencia</h2>
                        <p className="text-center text-muted-foreground text-xs mb-3">
                            Mueve dinero entre cuentas
                        </p>
                        <div className="w-full">
                            <AddTransferButton institutions={institutions} cashProducts={cashProducts} />
                        </div>
                    </div>
                </div>

                {/* Transactions History Table */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    {/* Filters Header */}
                    <div className="p-6 border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-card-foreground">Historial de Transacciones</h2>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                >
                                    ✕ Limpiar filtros
                                </button>
                            )}
                        </div>

                        {/* Filters Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Institution Filter */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Institución
                                </label>
                                <select
                                    value={filterInstitutionId}
                                    onChange={(e) => {
                                        setFilterInstitutionId(e.target.value);
                                        setFilterProductId(''); // Reset product filter
                                    }}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                >
                                    <option value="">Todas las instituciones</option>
                                    <option value="CASH">💵 Efectivo</option>
                                    {institutions.map(inst => (
                                        <option key={inst.id} value={inst.id}>
                                            {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Product Filter */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Producto/Cuenta
                                </label>
                                <select
                                    value={filterProductId}
                                    onChange={(e) => setFilterProductId(e.target.value)}
                                    disabled={!filterInstitutionId}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {filterInstitutionId ? 'Todos los productos' : 'Seleccione institución'}
                                    </option>
                                    {availableProducts.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} ({product.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date Filter */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            {/* End Date Filter */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Hasta
                                </label>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Results count */}
                        <div className="mt-4 text-sm text-muted-foreground">
                            Mostrando <span className="font-semibold text-foreground">{filteredAndSortedTransactions.length}</span> de {initialTransactions.length} transacciones
                        </div>
                    </div>

                    {/* Transactions Table */}
                    {filteredAndSortedTransactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4 opacity-50">📭</div>
                            <p className="text-muted-foreground">
                                {hasActiveFilters
                                    ? 'No hay transacciones que coincidan con los filtros'
                                    : 'No hay transacciones registradas aún'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => toggleSort('date')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Fecha
                                                {sortField === 'date' && (
                                                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => toggleSort('description')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Descripción
                                                {sortField === 'description' && (
                                                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Cuenta
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Categoría
                                        </th>
                                        <th
                                            className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => toggleSort('amount')}
                                        >
                                            <div className="flex items-center justify-end gap-2">
                                                Monto
                                                {sortField === 'amount' && (
                                                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredAndSortedTransactions.map((transaction) => {
                                        const product = transaction.fromProduct || transaction.toProduct;
                                        const currency = product?.currency || 'ARS';
                                        const isExpense = transaction.type === 'EXPENSE';
                                        const isIncome = transaction.type === 'INCOME';
                                        const isTransfer = transaction.type === 'TRANSFER';

                                        return (
                                            <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    {new Date(transaction.date).toLocaleDateString('es-AR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg flex-shrink-0">
                                                            {isTransfer ? '🔄' : transaction.category?.icon || '💸'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{transaction.description}</p>
                                                            {transaction.installmentNumber && (
                                                                <p className="text-xs text-blue-500">
                                                                    Cuota {transaction.installmentNumber}/{transaction.installmentTotal}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {isTransfer && transaction.fromProduct && transaction.toProduct ? (
                                                        <div>
                                                            <p className="text-foreground font-medium">
                                                                {transaction.fromProduct.name} → {transaction.toProduct.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {transaction.fromProduct.institution.name} → {transaction.toProduct.institution.name}
                                                            </p>
                                                        </div>
                                                    ) : product && (
                                                        <div>
                                                            <p className="text-foreground font-medium">{product.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {product.institution.name}
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {isTransfer ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                                            🔄 Transferencia
                                                        </span>
                                                    ) : transaction.category ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                                            {transaction.category.icon && <span>{transaction.category.icon}</span>}
                                                            {transaction.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs">Sin categoría</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <p className={`font-bold text-sm ${isIncome ? 'text-green-600' :
                                                        isExpense ? 'text-red-600' :
                                                            isTransfer ? 'text-blue-600' :
                                                                'text-foreground'
                                                        }`}>
                                                        {isExpense ? '-' : isIncome ? '+' : isTransfer ? '↔' : ''}
                                                        {currency === 'ARS' ? '$' : 'US$'} {Math.abs(transaction.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTransaction(transaction);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                                        title="Editar transacción"
                                                    >
                                                        ✏️
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

            {/* Edit Transaction Modal */}
            {selectedTransaction && (
                <EditTransactionModal
                    transaction={selectedTransaction}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedTransaction(null);
                    }}
                    onSuccess={() => {
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
