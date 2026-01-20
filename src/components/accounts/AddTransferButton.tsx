'use client'

import { useState, useEffect, useMemo } from 'react';
import { createTransfer } from '@/src/actions/transactions/transfer-actions';
import { Modal, Input, Select, Button, MoneyInput } from '@/src/components/ui';
import { getTodayInBuenosAires } from '@/src/utils/date';

interface Product {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    institutionId?: string | null;
}

interface Institution {
    id: string;
    name: string;
    type: string;
    products: Product[];
}

interface AddTransferButtonProps {
    institutions: Institution[];
    cashProducts: Product[];
    variant?: 'default' | 'cardAction';
    defaultInstitutionId?: string;
    defaultProductId?: string;
}

export default function AddTransferButton({
    institutions,
    cashProducts,
    variant = 'default',
    defaultInstitutionId,
    defaultProductId
}: AddTransferButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Origin selection state
    const [selectedFromInstitutionId, setSelectedFromInstitutionId] = useState<string>('');
    const [selectedFromProductId, setSelectedFromProductId] = useState('');

    // Update selection when modal opens
    useEffect(() => {
        if (isOpen) {
            if (defaultInstitutionId) setSelectedFromInstitutionId(defaultInstitutionId);
            if (defaultProductId) setSelectedFromProductId(defaultProductId);
        }
    }, [isOpen, defaultInstitutionId, defaultProductId]);

    // Destination selection state
    const [selectedToInstitutionId, setSelectedToInstitutionId] = useState<string>('');
    const [selectedToProductId, setSelectedToProductId] = useState('');

    const [dateValue, setDateValue] = useState('');
    const [amount, setAmount] = useState('');
    const [destinationAmount, setDestinationAmount] = useState('');

    // Initialize date with today
    useEffect(() => {
        setDateValue(getTodayInBuenosAires());
    }, []);

    // Filter products based on selected institution (for origin)
    const rawFromProducts = useMemo(() => selectedFromInstitutionId === 'CASH'
        ? cashProducts
        : selectedFromInstitutionId
            ? institutions.find(i => i.id === selectedFromInstitutionId)?.products || []
            : [], [selectedFromInstitutionId, cashProducts, institutions]);

    // Filter valid products for transfers (no credit cards, no loans)
    const availableFromProducts = useMemo(() => rawFromProducts.filter(p =>
        p.type === 'CASH' ||
        p.type === 'SAVINGS_ACCOUNT' ||
        p.type === 'CHECKING_ACCOUNT' ||
        p.type === 'DEBIT_CARD'
    ), [rawFromProducts]);

    // Filter products based on selected institution (for destination)
    const rawToProducts = useMemo(() => selectedToInstitutionId === 'CASH'
        ? cashProducts
        : selectedToInstitutionId
            ? institutions.find(i => i.id === selectedToInstitutionId)?.products || []
            : [], [selectedToInstitutionId, cashProducts, institutions]);

    // Filter valid products for transfers (including cards for payment)
    const availableToProducts = useMemo(() => rawToProducts.filter(p =>
        p.type === 'CASH' ||
        p.type === 'SAVINGS_ACCOUNT' ||
        p.type === 'CHECKING_ACCOUNT' ||
        p.type === 'DEBIT_CARD' ||
        p.type === 'CREDIT_CARD'
    ), [rawToProducts]);

    // Auto-select product when institution changes
    useEffect(() => {
        if (availableFromProducts.length === 1) {
            setSelectedFromProductId(availableFromProducts[0].id);
        } else if (selectedFromProductId) {
            const currentIsValid = availableFromProducts.some(p => p.id === selectedFromProductId);
            if (!currentIsValid) setSelectedFromProductId('');
        }
    }, [selectedFromInstitutionId, availableFromProducts]);

    useEffect(() => {
        if (availableToProducts.length === 1) {
            setSelectedToProductId(availableToProducts[0].id);
        } else {
            setSelectedToProductId('');
        }
    }, [selectedToInstitutionId, availableToProducts]);

    const selectedFromProduct = availableFromProducts.find(p => p.id === selectedFromProductId);
    const selectedToProduct = availableToProducts.find(p => p.id === selectedToProductId);
    const differentCurrency = selectedFromProduct && selectedToProduct && selectedFromProduct.currency !== selectedToProduct.currency;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const result = await createTransfer(formData);

            if (result.success) {
                form.reset();
                setSelectedFromInstitutionId('');
                setSelectedFromProductId('');
                setSelectedToInstitutionId('');
                setSelectedToProductId('');
                setAmount('');
                setDestinationAmount('');
                setIsOpen(false);
                setDateValue(getTodayInBuenosAires());
            } else {
                setError(result.error || 'Error al realizar la transferencia');
            }
        } catch (err) {
            setError('Error al realizar la transferencia');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {variant === 'cardAction' ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 py-6 hover:bg-white/5 transition-all group rounded-2xl"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all border border-blue-500/30">
                        <span className="material-symbols-outlined text-[22px]">sync_alt</span>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-medium">Transferir</p>
                        <p className="text-white/50 text-xs">Entre cuentas</p>
                    </div>
                </button>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    variant="primary"
                    size="sm"
                    icon={<span className="material-symbols-outlined text-[20px]">sync_alt</span>}
                >
                    Transferir
                </Button>
            )}

            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    size="md"
                    title="Transferir entre cuentas"
                    description="Mueve fondos de forma instantánea"
                    icon={<span className="material-symbols-outlined text-[24px]">sync_alt</span>}
                >
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-shake">
                            <span className="material-symbols-outlined text-[20px]">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Middle Row: Origin and Destination (Moved to Top) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
                            {/* Connector Arrow (Desktop only) */}
                            <div className="hidden md:flex absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 border border-white/10 shadow-lg items-center justify-center z-10">
                                <span className="material-symbols-outlined text-white/60 text-[18px]">arrow_forward</span>
                            </div>

                            {/* Source Account */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Origen</label>
                                </div>
                                <div className="space-y-4 p-5 rounded-[28px] border border-orange-500/20 bg-orange-500/5">
                                    <Select
                                        value={selectedFromInstitutionId}
                                        onChange={(e) => setSelectedFromInstitutionId(e.target.value)}
                                        className="glass-input !bg-transparent"
                                    >
                                        <option value="" className="bg-slate-900 text-white">Seleccionar Institución...</option>
                                        <option value="CASH" className="bg-slate-900 text-white">💵 Efectivo</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id} className="bg-slate-900 text-white">
                                                {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                            </option>
                                        ))}
                                    </Select>
                                    <Select
                                        name="fromProductId"
                                        value={selectedFromProductId}
                                        onChange={(e) => setSelectedFromProductId(e.target.value)}
                                        required
                                        disabled={!selectedFromInstitutionId}
                                        className="glass-input !bg-transparent"
                                    >
                                        <option value="" className="bg-slate-900 text-white">Cuenta de origen...</option>
                                        {availableFromProducts.map(product => (
                                            <option key={product.id} value={product.id} className="bg-slate-900 text-white">
                                                {product.name} ({product.currency}) - ${product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </option>
                                        ))}
                                    </Select>
                                    {selectedFromInstitutionId && availableFromProducts.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-orange-500/20">
                                            <p className="text-[10px] uppercase font-bold text-orange-400 mb-2 tracking-wider">Cuentas disponibles</p>
                                            <div className="space-y-1.5">
                                                {availableFromProducts.map(product => (
                                                    <div key={product.id} className={`flex justify-between items-center text-xs p-1.5 rounded-lg transition-colors ${selectedFromProductId === product.id ? 'bg-orange-500/20 text-orange-300 font-medium' : 'text-slate-400 hover:bg-white/5'}`}>
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            <span className="truncate">{product.name}</span>
                                                            <span className="text-[10px] opacity-75 shrink-0">({product.currency})</span>
                                                        </div>
                                                        <span className="font-medium shrink-0">
                                                            $ {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Destination Account */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Destino</label>
                                </div>
                                <div className="space-y-4 p-5 rounded-[28px] border border-emerald-500/20 bg-emerald-500/5">
                                    <Select
                                        value={selectedToInstitutionId}
                                        onChange={(e) => setSelectedToInstitutionId(e.target.value)}
                                        className="glass-input !bg-transparent"
                                    >
                                        <option value="" className="bg-slate-900 text-white">Seleccionar Institución...</option>
                                        <option value="CASH" className="bg-slate-900 text-white">💵 Efectivo</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id} className="bg-slate-900 text-white">
                                                {inst.type === 'BANK' ? '🏦' : '📱'} {inst.name}
                                            </option>
                                        ))}
                                    </Select>
                                    <Select
                                        name="toProductId"
                                        value={selectedToProductId}
                                        onChange={(e) => setSelectedToProductId(e.target.value)}
                                        required
                                        disabled={!selectedToInstitutionId}
                                        className="glass-input !bg-transparent"
                                    >
                                        <option value="" className="bg-slate-900 text-white">Cuenta de destino...</option>
                                        {availableToProducts.map(product => (
                                            <option key={product.id} value={product.id} className="bg-slate-900 text-white">
                                                {product.name} ({product.currency}) - ${product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </option>
                                        ))}
                                    </Select>
                                    {selectedToInstitutionId && availableToProducts.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-emerald-500/20">
                                            <p className="text-[10px] uppercase font-bold text-emerald-400 mb-2 tracking-wider">Cuentas disponibles</p>
                                            <div className="space-y-1.5">
                                                {availableToProducts.map(product => (
                                                    <div key={product.id} className={`flex justify-between items-center text-xs p-1.5 rounded-lg transition-colors ${selectedToProductId === product.id ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:bg-white/5'}`}>
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            <span className="truncate">{product.name}</span>
                                                            <span className="text-[10px] opacity-75 shrink-0">({product.currency})</span>
                                                        </div>
                                                        <span className="font-medium shrink-0">
                                                            $ {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Row: Date and Amount (Moved to Middle) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                type="date"
                                label="Fecha de operación"
                                name="date"
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                required
                            />
                            <div className="space-y-1">
                                <MoneyInput
                                    label="Monto a transferir"
                                    currency={selectedFromProduct?.currency === 'USD' ? 'US$' : '$'}
                                    value={amount}
                                    onChange={(value) => setAmount(value)}
                                    required
                                    placeholder="0,00"
                                />
                                <input type="hidden" name="amount" value={amount} />
                                {selectedFromProduct && (
                                    <p className="text-[10px] text-slate-400 ml-1 italic">
                                        Saldo disponible: {selectedFromProduct.currency} {selectedFromProduct.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>

                            {differentCurrency && selectedToProduct && (
                                <div className="space-y-1 md:col-span-2">
                                    <div className="flex items-center gap-4 my-2">
                                        <div className="h-px flex-1 bg-slate-200"></div>
                                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Conversión de Moneda</div>
                                        <div className="h-px flex-1 bg-slate-200"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="hidden md:block"></div> {/* Spacer to align with right column */}
                                        <div>
                                            <MoneyInput
                                                label={`Monto a recibir en ${selectedToProduct.currency}`}
                                                currency={selectedToProduct.currency === 'USD' ? 'US$' : '$'}
                                                value={destinationAmount}
                                                onChange={(value) => setDestinationAmount(value)}
                                                required
                                                placeholder="0,00"
                                            />
                                            <input type="hidden" name="destinationAmount" value={destinationAmount} />
                                            <p className="text-[10px] text-slate-400 ml-1 italic">
                                                Tipo de cambio implícito se calculará automáticamente
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Row: Description */}
                        <Input
                            label="Descripción"
                            type="text"
                            name="description"
                            placeholder="Ej: Transferencia entre ahorros"
                        />

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsOpen(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isLoading}
                                className="flex-[2]"
                                icon={<span className="material-symbols-outlined">check_circle</span>}
                            >
                                Realizar Transferencia
                            </Button>
                        </div>
                    </form>
                </Modal >
            )
            }
        </>
    );
}
