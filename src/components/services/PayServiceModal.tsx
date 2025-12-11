'use client'

import React, { useState, useEffect } from 'react';
import { FinancialProduct, ProductType } from '@prisma/client';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { payServiceBill } from '@/src/actions/services/service-actions';
import { useAsync } from '@/src/hooks/useAsync';
import { getAccountsPageData } from '@/src/actions/accounts/account-actions';

interface PayServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: any;
    onSuccess: () => void;
}

export default function PayServiceModal({ isOpen, onClose, bill, onSuccess }: PayServiceModalProps) {
    const [amount, setAmount] = useState(bill.amount.toString());
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [products, setProducts] = useState<any[]>([]); // Using any[] because we receive serialized data from server

    // Payment Rules Logic
    const [appliedRule, setAppliedRule] = useState<any>(null);

    const { execute, loading } = useAsync();

    useEffect(() => {
        // Load accounts for payment
        getAccountsPageData().then(res => {
            // Extract all products from institutions and add cash products
            const institutionProducts = res.institutions.flatMap(inst => inst.products);
            const allProducts = [...institutionProducts, ...res.cashProducts];

            // Filter only accounts/cards with balance or limit
            const validProducts = allProducts.filter((p: any) =>
                p.type === ProductType.SAVINGS_ACCOUNT ||
                p.type === ProductType.CHECKING_ACCOUNT ||
                p.type === ProductType.DEBIT_CARD ||
                p.type === ProductType.CREDIT_CARD ||
                p.type === ProductType.CASH
            );
            setProducts(validProducts);
            if (validProducts.length > 0) setSelectedProductId(validProducts[0].id);
        });
    }, []);

    // Watch for Product Change to apply Rules
    useEffect(() => {
        if (selectedProductId && bill.service.paymentRules) {
            const rule = bill.service.paymentRules.find((r: any) => r.productId === selectedProductId);
            setAppliedRule(rule || null);
        } else {
            setAppliedRule(null);
        }
    }, [selectedProductId, bill]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('billId', bill.id);
        formData.append('productId', selectedProductId);
        formData.append('amount', amount); // User confirmed amount (before discount)
        formData.append('date', date);

        const result = await execute(() => payServiceBill(formData));
        if (result.success) {
            onSuccess();
        } else {
            alert(result.error);
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Pagar ${bill.service.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground mb-4">
                    <p>Vencimiento: {new Date(bill.dueDate).toLocaleDateString('es-AR')}</p>
                    {bill.service.renewalNote && (
                        <p className="text-amber-600 mt-1">⚠️ Nota: {bill.service.renewalNote}</p>
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

                <Select
                    label="Medio de Pago"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                >
                    <option value="" disabled>Seleccionar cuenta/tarjeta</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.currency}) - {p.type === 'CREDIT_CARD' ? 'Tarjeta' : `$${Number(p.balance).toLocaleString()}`}
                        </option>
                    ))}
                </Select>

                <Input
                    label="Fecha de Pago"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />

                {/* RULES & BENEFITS DISPLAY */}
                {appliedRule && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg">
                        <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-1">
                            ¡Beneficio Aplicado! ✨
                        </p>

                        {appliedRule.benefitType === 'DISCOUNT' && (
                            <div className="flex justify-between items-center text-sm">
                                <span>Descuento ({Number(appliedRule.value)}%):</span>
                                <span className="font-bold text-green-600">-${discountAmount.toLocaleString('es-AR')}</span>
                            </div>
                        )}

                        {appliedRule.benefitType === 'CASHBACK' && (
                            <div className="flex justify-between items-center text-sm">
                                <span>Cashback ({Number(appliedRule.value)}%):</span>
                                <span className="font-bold text-green-600">+${cashbackAmount.toLocaleString('es-AR')} (Reintegro)</span>
                            </div>
                        )}

                        {appliedRule.benefitType === 'DISCOUNT' && (
                            <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between items-center font-bold text-lg">
                                <span>Total a Debitar:</span>
                                <span>${finalAmount.toLocaleString('es-AR')}</span>
                            </div>
                        )}
                        {appliedRule.benefitType === 'CASHBACK' && (
                            <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between items-center font-bold text-lg">
                                <span>Total a Debitar:</span>
                                <span>${baseAmount.toLocaleString('es-AR')}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading} variant="primary">
                        Confirmar Pago
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
