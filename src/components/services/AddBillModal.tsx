'use client'

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { createBill } from '@/src/actions/services/service-actions';

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
    const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

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
        <Modal isOpen={isOpen} onClose={onClose} title="Nueva Boleta">
            <form action={handleSubmit} className="space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground mb-4">
                    <p>Creando boleta para: <b className="capitalize">
                        {new Date(currentYear, currentMonth - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                    </b></p>
                </div>

                <div className="w-full">
                    <label className="block text-sm font-medium text-foreground mb-2">Servicio</label>
                    <select
                        name="serviceId"
                        className="w-full p-3 border border-border rounded-xl bg-background text-foreground"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        required
                    >
                        <option value="">Seleccionar Servicio...</option>
                        {services.filter(s => s.active).map(service => (
                            <option key={service.id} value={service.id}>{service.name}</option>
                        ))}
                    </select>
                </div>

                <Input
                    name="amount"
                    label="Monto"
                    type="number"
                    step="0.01"
                    defaultValue={selectedService?.defaultAmount || ''}
                    required
                />

                <Input
                    name="dueDate"
                    label="Fecha de Vencimiento"
                    type="date"
                    defaultValue={selectedServiceId ? defaultDueDateStr : ''}
                    required
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={isLoading}>Crear Boleta</Button>
                </div>
            </form>
        </Modal>
    );
}
