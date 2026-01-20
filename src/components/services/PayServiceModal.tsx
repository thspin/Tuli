'use client'

import React, { useState, useEffect, useRef } from 'react';
import { ProductType } from '@prisma/client';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { payServiceBill, linkBillToTransaction } from '@/src/actions/services/service-actions';
import { getUnlinkedTransactions } from '@/src/actions/transactions/transaction-actions';
import { getTodayInBuenosAires, formatDate } from '@/src/utils/date';
import { startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

import { getAccountsPageData } from '@/src/actions/accounts/account-actions';

interface PayServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: any;
    onSuccess: () => void;
}

export default function PayServiceModal({ isOpen, onClose, bill, onSuccess }: PayServiceModalProps) {
    // Tabs: 'pay' | 'link'
    const [activeTab, setActiveTab] = useState<'pay' | 'link'>('pay');

    // Pay Form State
    const [amount, setAmount] = useState(bill.amount.toString());
    const [date, setDate] = useState(getTodayInBuenosAires());
    const [selectedProductId, setSelectedProductId] = useState('');
    const [products, setProducts] = useState<any[]>([]);

    // Link Form State
    const [unlinkedTransactions, setUnlinkedTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    // Common State
    const [loading, setLoading] = useState(false);
    const [appliedRule, setAppliedRule] = useState<any>(null);

    // Custom Select State
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Load Initial Data
    useEffect(() => {
        if (!isOpen) return;

        // Reset states
        setActiveTab('pay');
        setAmount(bill.amount.toString());
        setDate(getTodayInBuenosAires());
        setSelectedTransactionId(null);
        setIsSelectOpen(false);

        // Load Accounts
        getAccountsPageData().then(res => {
            const institutionProducts = res.institutions.flatMap(inst => inst.products);
            const allProducts = [...institutionProducts, ...res.cashProducts];

            const validProducts = allProducts.filter((p: any) =>
                p.type === ProductType.SAVINGS_ACCOUNT ||
                p.type === ProductType.CHECKING_ACCOUNT ||
                p.type === ProductType.DEBIT_CARD ||
                p.type === ProductType.CREDIT_CARD ||
                p.type === ProductType.CASH
            );
            setProducts(validProducts);
            if (validProducts.length > 0 && !selectedProductId) setSelectedProductId(validProducts[0].id);
        });

        // Load Unlinked Transactions
        loadUnlinkedTransactions();
    }, [isOpen, bill]);

    // Close select on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsSelectOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadUnlinkedTransactions = async () => {
        setLoadingTransactions(true);
        const billDate = new Date(bill.dueDate);
        const start = startOfMonth(subMonths(billDate, 1));
        const end = endOfMonth(addMonths(billDate, 1));

        const res = await getUnlinkedTransactions(start, end, bill.service.categoryId);
        if (res.success && res.transactions) {
            setUnlinkedTransactions(res.transactions);
        }
        setLoadingTransactions(false);
    }

    // Apply Payment Rules
    useEffect(() => {
        if (selectedProductId && bill.service.paymentRules) {
            const rule = bill.service.paymentRules.find((r: any) => r.productId === selectedProductId);
            setAppliedRule(rule || null);
        } else {
            setAppliedRule(null);
        }
    }, [selectedProductId, bill]);

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('billId', bill.id);
        formData.append('productId', selectedProductId);
        formData.append('amount', amount);
        formData.append('date', date);

        setLoading(true);
        try {
            const result = await payServiceBill(formData);
            if (result.success) onSuccess();
            else alert(result.error);
        } catch (error) {
            alert('Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkSubmit = async () => {
        if (!selectedTransactionId) return;
        setLoading(true);
        try {
            const result = await linkBillToTransaction(bill.id, selectedTransactionId);
            if (result.success) onSuccess();
            else alert(result.error);
        } catch (error) {
            alert('Error al vincular el pago');
        } finally {
            setLoading(false);
        }
    };

    // Calculate display values
    const baseAmount = parseFloat(amount) || 0;
    let finalAmount = baseAmount;
    let discountAmount = 0;
    let cashbackAmount = 0;

    if (appliedRule) {
        if (appliedRule.benefitType === 'DISCOUNT') {
            discountAmount = baseAmount * (Number(appliedRule.value) / 100);
            finalAmount = baseAmount - discountAmount;
        } else if (appliedRule.benefitType === 'CASHBACK') {
            cashbackAmount = baseAmount * (Number(appliedRule.value) / 100);
        }
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Pagar ${bill.service.name}`} size="md">

            {/* Tabs - Glass Style */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
                <button
                    onClick={() => setActiveTab('pay')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'pay' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                >
                    Nuevo Pago
                </button>
                <button
                    onClick={() => setActiveTab('link')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'link' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                >
                    Vincular Existente
                </button>
            </div>

            {activeTab === 'pay' ? (
                <form onSubmit={handlePaySubmit} className="space-y-4">
                    {/* Bill Info - Glass Style */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-white/50">Monto Original</span>
                            <span className="font-bold text-white">${Number(bill.amount).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/50">Vencimiento</span>
                            <span className="font-medium text-white/80">{formatDate(bill.dueDate)}</span>
                        </div>
                        {bill.service.renewalNote && (
                            <p className="text-xs text-amber-400 font-bold mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">warning</span> {bill.service.renewalNote}
                            </p>
                        )}
                    </div>

                    <Input
                        label="Monto a Pagar"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />

                    {/* Custom Product Selector - Glass Style */}
                    <div className="space-y-2 relative" ref={selectRef}>
                        <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest ml-1">Medio de Pago</label>
                        <div
                            className="w-full glass-input px-4 py-3 cursor-pointer hover:bg-white/15 transition-all flex items-center justify-between group"
                            onClick={() => setIsSelectOpen(!isSelectOpen)}
                        >
                            {selectedProduct ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                                        {selectedProduct.type === 'CASH' ? '💵' :
                                            selectedProduct.type === 'CREDIT_CARD' ? '💳' :
                                                selectedProduct.institution?.name?.includes('Mercado Pago') ? '👛' : '🏦'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-none mb-0.5">{selectedProduct.name}</p>
                                        <p className="text-[10px] text-white/50 font-medium">
                                            {selectedProduct.type === 'CREDIT_CARD' ? 'Tarjeta de Crédito' : `Saldo: $${Number(selectedProduct.balance).toLocaleString()}`}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-white/40">Seleccionar cuenta...</span>
                            )}
                            <span className={`material-symbols-outlined text-white/40 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </div>

                        {/* Dropdown Options - Glass Style */}
                        {isSelectOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 glass-card-elevated z-50 max-h-64 overflow-y-auto divide-y divide-white/10">
                                {products.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => { setSelectedProductId(p.id); setIsSelectOpen(false); }}
                                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${selectedProductId === p.id ? 'bg-blue-500/20' : 'hover:bg-white/10'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-lg">
                                            {p.type === 'CASH' ? '💵' :
                                                p.type === 'CREDIT_CARD' ? '💳' :
                                                    p.institution?.name?.includes('Mercado Pago') ? '👛' : '🏦'}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold leading-none mb-0.5 ${selectedProductId === p.id ? 'text-blue-300' : 'text-white'}`}>{p.name}</p>
                                            <p className="text-[10px] text-white/50">
                                                {p.type === 'CREDIT_CARD' ? 'Crédito' : `${p.currency} $${Number(p.balance).toLocaleString()}`}
                                                {p.institution && ` • ${p.institution.name}`}
                                            </p>
                                        </div>
                                        {selectedProductId === p.id && <span className="material-symbols-outlined text-blue-400 text-lg">check</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Input
                        label="Fecha de Pago"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />

                    {/* Rules Summary - Glass Style */}
                    {appliedRule && (
                        <div className="bg-blue-500/10 border border-blue-400/20 p-3 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-blue-400 text-[18px]">verified</span>
                                <p className="font-bold text-blue-300 text-xs uppercase tracking-wide">Beneficio Aplicado</p>
                            </div>

                            {appliedRule.benefitType === 'DISCOUNT' && (
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-blue-300/80">
                                        <span>Descuento ({Number(appliedRule.value)}%):</span>
                                        <span>-${discountAmount.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-white pt-1 border-t border-blue-400/20">
                                        <span>Total a Debitar:</span>
                                        <span>${finalAmount.toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            )}

                            {appliedRule.benefitType === 'CASHBACK' && (
                                <div className="flex justify-between items-center text-sm font-bold text-emerald-400">
                                    <span>Cashback ({Number(appliedRule.value)}%):</span>
                                    <span>+${cashbackAmount.toLocaleString('es-AR')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" loading={loading} variant="primary" icon={<span className="material-symbols-outlined">payments</span>}>Pagar</Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {/* Link Existing Tab */}
                    {loadingTransactions ? (
                        <div className="py-8 text-center text-white/40">
                            <span className="material-symbols-outlined animate-spin text-3xl">refresh</span>
                            <p className="text-xs font-medium mt-2">Buscando pagos...</p>
                        </div>
                    ) : unlinkedTransactions.length === 0 ? (
                        <div className="py-8 text-center glass-card">
                            <span className="material-symbols-outlined text-white/20 text-4xl mb-2">receipt_long</span>
                            <p className="text-sm font-bold text-white/50">No se encontraron pagos recientes</p>
                            <p className="text-xs text-white/30 mt-1 max-w-[200px] mx-auto">Solo se muestran gastos no vinculados de este mes (+/- 30 días)</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 mb-2">Pagos Candidatos</p>
                            {unlinkedTransactions.map(tx => (
                                <div
                                    key={tx.id}
                                    onClick={() => setSelectedTransactionId(tx.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedTransactionId === tx.id
                                        ? 'bg-blue-500/20 border-blue-400/30 shadow-sm ring-1 ring-blue-400/30'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${Math.abs(Number(tx.amount) - Number(bill.amount)) < Number(bill.amount) * 0.05
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-white/10 text-white/50'
                                            }`}>
                                            <span className="material-symbols-outlined">
                                                {Math.abs(Number(tx.amount) - Number(bill.amount)) < Number(bill.amount) * 0.05 ? 'check_circle' : 'paid'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{tx.description}</p>
                                            <p className="text-xs text-white/50">
                                                {formatDate(tx.date)} • {tx.fromProduct?.name || 'Desconocido'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">${Number(tx.amount).toLocaleString('es-AR')}</p>
                                        {Math.abs(Number(tx.amount) - Number(bill.amount)) < Number(bill.amount) * 0.05 && (
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded ml-auto block w-fit">COINCIDE</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button
                            type="button"
                            onClick={handleLinkSubmit}
                            disabled={!selectedTransactionId}
                            loading={loading}
                            variant="primary"
                            icon={<span className="material-symbols-outlined">link</span>}
                        >
                            Vincular Pago
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
