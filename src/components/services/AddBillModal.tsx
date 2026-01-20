'use client'

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { createBill } from '@/src/actions/services/service-actions';
import { formatDate, toISODate } from '@/src/utils/date';

interface AddBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    services: any[];
    currentMonth: number;
    currentYear: number;
    onSuccess: () => void;
}

export default function AddBillModal({ isOpen, onClose, services, currentMonth, currentYear, onSuccess }: AddBillModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState('');

    // Get default due date based on selected service
    const selectedService = services.find(s => s.id === selectedServiceId);
    const defaultDueDay = selectedService?.defaultDueDay || 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const safeDueDay = Math.min(defaultDueDay, daysInMonth);
    const defaultDueDate = new Date(currentYear, currentMonth - 1, safeDueDay);
    const defaultDueDateStr = toISODate(defaultDueDate);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        formData.append('month', currentMonth.toString());
        formData.append('year', currentYear.toString());

        const res = await createBill(formData);

        if (res.success) {
            setIsLoading(false);
            setSelectedServiceId('');
            onSuccess();
        } else {
            alert(res.error);
            setIsLoading(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nueva Boleta"
            description="Registra un nuevo vencimiento para tus servicios"
            icon={<span className="material-symbols-outlined">description</span>}
            size="md"
        >
            <form action={handleSubmit} className="space-y-6">
                {/* Period Info Card - Glass Style */}
                <div className="bg-blue-500/10 border border-blue-400/20 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                        <span className="material-symbols-outlined">calendar_month</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-blue-300/70 uppercase tracking-widest leading-none mb-1">Periodo de Facturación</p>
                        <p className="text-sm font-bold text-white capitalize">
                            {formatDate(new Date(currentYear, currentMonth - 1), { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <Select
                    name="serviceId"
                    label="Servicio"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    required
                >
                    <option value="" className="bg-slate-800">Seleccionar Servicio...</option>
                    {services.filter(s => s.active).map(service => (
                        <option key={service.id} value={service.id} className="bg-slate-800">{service.name}</option>
                    ))}
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        name="amount"
                        label="Monto a Pagar"
                        type="number"
                        step="0.01"
                        defaultValue={selectedService?.defaultAmount || ''}
                        required
                        placeholder="0.00"
                    />

                    <Input
                        name="dueDate"
                        label="Fecha de Vencimiento"
                        type="date"
                        defaultValue={selectedServiceId ? defaultDueDateStr : ''}
                        required
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" loading={isLoading} className="flex-1" icon={<span className="material-symbols-outlined">add_task</span>}>
                        Crear Boleta
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
