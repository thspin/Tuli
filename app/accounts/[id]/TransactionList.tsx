
'use client';

import { useState } from 'react';

interface Transaction {
    id: string;
    amount: number;
    date: Date | string;
    description: string;
    type: string;
    installmentNumber?: number | null;
    installmentTotal?: number | null;
    category?: {
        name: string;
        icon: string | null;
    } | null;
}

interface TransactionListProps {
    initialTransactions: Transaction[];
    currency: string;
}

export default function TransactionList({ initialTransactions, currency }: TransactionListProps) {
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    const filteredTransactions = initialTransactions.filter(t => {
        if (filterType === 'ALL') return true;
        return t.type === filterType;
    });

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">Historial de Transacciones</h2>

                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">Todos</option>
                        <option value="INCOME">Ingresos</option>
                        <option value="EXPENSE">Egresos</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                        title={sortOrder === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
                    >
                        {sortOrder === 'asc' ? '⬆️ Antiguos' : '⬇️ Recientes'}
                    </button>
                </div>
            </div>

            {sortedTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    No hay transacciones que coincidan con los filtros.
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {sortedTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                    {transaction.category?.icon || '💸'}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{transaction.description}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(transaction.date).toLocaleString('es-AR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        {transaction.category && ` • ${transaction.category.name}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${transaction.type === 'INCOME' ? 'text-green-600' :
                                    transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-gray-900'
                                    }`}>
                                    {transaction.type === 'EXPENSE' ? '-' : '+'}
                                    {currency === 'ARS' ? '$' : 'US$'} {Math.abs(transaction.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                                {transaction.installmentNumber && (
                                    <p className="text-xs text-blue-600">
                                        Cuota {transaction.installmentNumber}/{transaction.installmentTotal}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
