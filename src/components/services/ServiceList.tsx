'use client'

import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { createService, updateServiceFromForm, deleteService } from '@/src/actions/services/service-actions';
import { formatDate, toISODate } from '@/src/utils/date';

interface ServiceListProps {
    services: any[];
    categories: any[];
    onRefresh: () => void;
}

export default function ServiceList({ services, categories, onRefresh }: ServiceListProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);
    const [deletingService, setDeletingService] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deletingService) return;
        setIsDeleting(true);
        const res = await deleteService(deletingService.id);
        setIsDeleting(false);
        if (res.success) {
            setDeletingService(null);
            onRefresh();
        } else {
            alert(res.error);
        }
    };

    // Helper to infer icon based on service name
    const getServiceIcon = (service: any) => {
        const name = service.name.toLowerCase();
        if (name.includes('gas') || name.includes('naturgy') || name.includes('metro')) return '🔥';
        if (name.includes('luz') || name.includes('electric') || name.includes('edelar') || name.includes('edenor') || name.includes('edesur') || name.includes('coop')) return '⚡';
        if (name.includes('agua') || name.includes('aysa')) return '💧';
        if (name.includes('internet') || name.includes('wifi') || name.includes('fiber') || name.includes('telecentro') || name.includes('personal') || name.includes('flow') || name.includes('starlink')) return '🌐';
        if (name.includes('celular') || name.includes('movil') || name.includes('claro') || name.includes('movistar') || name.includes('tuenti') || name.includes('linea')) return '📱';
        if (name.includes('seguro') || name.includes('poliza') || name.includes('patronal') || name.includes('federacion') || name.includes('zurich') || name.includes('allianz')) return '🛡️';
        if (name.includes('salud') || name.includes('medicina') || name.includes('prepaga') || name.includes('osde') || name.includes('swiss') || name.includes('galeno')) return '🏥';
        if (name.includes('municipal') || name.includes('rentas') || name.includes('abl') || name.includes('patente') || name.includes('arba') || name.includes('agip')) return '🏛️';
        if (name.includes('netflix') || name.includes('spotify') || name.includes('hbo') || name.includes('amazon') || name.includes('disney')) return '🎬';
        return service.category.icon;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white glass-text">Mis Servicios Configurados</h2>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    variant="primary"
                    size="sm"
                    icon={<span className="material-symbols-outlined text-[18px]">add</span>}
                >
                    Nuevo Servicio
                </Button>
            </div>

            {services.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white/30">
                        <span className="material-symbols-outlined text-3xl">rss_feed</span>
                    </div>
                    <p className="text-lg font-bold text-white/70 glass-text">No hay servicios configurados</p>
                    <p className="text-sm text-white/40 max-w-xs mx-auto mt-2">Agregá un servicio para comenzar a gestionar tus pagos mensuales.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => {
                        const icon = getServiceIcon(service);
                        const isEmoji = icon && !/^[a-z0-9_]+$/.test(icon);

                        return (
                            <div key={service.id} className="glass-card relative group overflow-hidden transition-all hover:bg-white/15">
                                {/* Action Buttons */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => setEditingService(service)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/40 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-500/10 transition-all"
                                        title="Editar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => setDeletingService(service)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 transition-all"
                                        title="Eliminar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>

                                <div className="flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/70 text-2xl">
                                            {isEmoji ? (
                                                <span>{icon}</span>
                                            ) : (
                                                <span className="material-symbols-outlined">{icon || 'settings_input_component'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white leading-none mb-1">{service.name}</h3>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{service.category.name}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/50 font-medium">Vencimiento:</span>
                                            <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-tight ${service.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                                                {service.active ? (service.defaultDueDay ? `Día ${service.defaultDueDay}` : 'Manual') : 'Inactivo'}
                                            </span>
                                        </div>

                                        {service.paymentRules.length > 0 && (
                                            <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-blue-400">
                                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{service.paymentRules.length} Reglas de Pago</span>
                                            </div>
                                        )}

                                        {service.renewalDate && (
                                            <div className="flex items-center gap-2 text-amber-400">
                                                <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    Renueva: {formatDate(service.renewalDate)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Service Modal */}
            <ServiceFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                categories={categories}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    onRefresh();
                }}
            />

            {/* Edit Service Modal */}
            {editingService && (
                <ServiceFormModal
                    isOpen={!!editingService}
                    onClose={() => setEditingService(null)}
                    categories={categories}
                    service={editingService}
                    onSuccess={() => {
                        setEditingService(null);
                        onRefresh();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deletingService}
                onClose={() => setDeletingService(null)}
                title="Eliminar Servicio"
                description={`¿Querés eliminar permanentemente ${deletingService?.name}?`}
                icon={<span className="material-symbols-outlined">delete_sweep</span>}
                size="sm"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-red-400">report</span>
                        </div>
                        <p className="text-sm text-red-300 font-medium">
                            <span className="font-bold">¡Cuidado!</span> Esta acción eliminará también todas las boletas históricas asociadas a este servicio.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDeletingService(null)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            loading={isDeleting}
                            className="flex-1"
                            icon={<span className="material-symbols-outlined">delete_forever</span>}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: any[];
    service?: any;
    onSuccess: () => void;
}

function ServiceFormModal({ isOpen, onClose, categories, service, onSuccess }: ServiceFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!service;

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);

        let res;
        if (isEditing) {
            res = await updateServiceFromForm(service.id, formData);
        } else {
            res = await createService(formData);
        }

        if (res.success) {
            setIsLoading(false);
            onSuccess();
        } else {
            alert(res.error);
            setIsLoading(false);
        }
    }

    const formatDateForInput = (date: string | Date | null) => {
        if (!date) return '';
        return toISODate(date);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Servicio" : "Nuevo Servicio"}
            description={isEditing ? "Modifica los detalles del servicio configurado" : "Configura un nuevo servicio para gestionar tus pagos"}
            icon={<span className="material-symbols-outlined">{isEditing ? 'edit_square' : 'add_task'}</span>}
            size="md"
        >
            <form action={handleSubmit} className="space-y-6">
                <Input
                    name="name"
                    label="Nombre del Servicio"
                    placeholder="Ej. Fibertel, Edenor, Expensas"
                    defaultValue={service?.name || ''}
                    required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        name="categoryId"
                        label="Categoría"
                        defaultValue={service?.categoryId || ''}
                        required
                    >
                        <option value="" className="bg-slate-800">Seleccionar Categoría...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-slate-800">{cat.name}</option>
                        ))}
                    </Select>

                    <Input
                        name="renewalDate"
                        label="Fin de Promoción"
                        type="date"
                        defaultValue={formatDateForInput(service?.renewalDate)}
                    />
                </div>

                <Input
                    name="renewalNote"
                    label="Nota / Recordatorio"
                    placeholder="Ej. Llamar para pedir descuento"
                    defaultValue={service?.renewalNote || ''}
                />

                {isEditing && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/50">
                                <span className="material-symbols-outlined">power_settings_new</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white leading-none mb-1">Estado del Servicio</p>
                                <p className="text-[10px] text-white/40 font-medium">Define si el servicio aparece en tu agenda</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="active"
                                id="active"
                                value="true"
                                defaultChecked={service?.active !== false}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" loading={isLoading} className="flex-1" icon={<span className="material-symbols-outlined">save</span>}>
                        {isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
