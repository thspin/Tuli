'use client'

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { createService, updateServiceFromForm, deleteService } from '@/src/actions/services/service-actions';

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">Mis Servicios Configurados</h2>
                <Button onClick={() => setIsAddModalOpen(true)} icon={<span>+</span>}>
                    Nuevo Servicio
                </Button>
            </div>

            {services.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                    <p className="text-lg mb-2">No hay servicios configurados</p>
                    <p className="text-sm">Agregá un servicio para comenzar a gestionar tus pagos mensuales.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(service => (
                        <Card key={service.id} className="relative group">
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingService(service)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => setDeletingService(service)}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Eliminar"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-2 pr-16">
                                <h3 className="font-bold text-lg">{service.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${service.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                    {service.active ? (service.defaultDueDay ? `Día ${service.defaultDueDay}` : 'Manual') : 'Inactivo'}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                                {service.category.name}
                            </p>
                            <p className="text-sm">
                                Monto aprox: <b>${Number(service.defaultAmount || 0).toLocaleString('es-AR')}</b>
                            </p>

                            {service.paymentRules.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-border text-xs">
                                    <span className="font-semibold text-blue-600">Beneficios Configurados: {service.paymentRules.length}</span>
                                </div>
                            )}

                            {service.renewalDate && (
                                <div className="mt-2 text-xs text-amber-600">
                                    Renueva: {new Date(service.renewalDate).toLocaleDateString('es-AR')}
                                </div>
                            )}
                        </Card>
                    ))}
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
            >
                <div className="space-y-4">
                    <p className="text-foreground">
                        ¿Estás seguro de que querés eliminar <b>{deletingService?.name}</b>?
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Esta acción eliminará también todas las boletas asociadas a este servicio.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setDeletingService(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
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
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Servicio" : "Nuevo Servicio"}>
            <form action={handleSubmit} className="space-y-4">
                <Input
                    name="name"
                    label="Nombre del Servicio"
                    placeholder="Ej. Internet, Luz"
                    defaultValue={service?.name || ''}
                    required
                />

                <div className="w-full">
                    <label className="block text-sm font-medium text-foreground mb-2">Categoría</label>
                    <select
                        name="categoryId"
                        className="w-full p-3 border border-border rounded-xl bg-background text-foreground"
                        defaultValue={service?.categoryId || ''}
                        required
                    >
                        <option value="">Seleccionar Categoría...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>


                <Input
                    name="renewalDate"
                    label="Fecha de Fin de Promo (Opcional)"
                    type="date"
                    defaultValue={formatDateForInput(service?.renewalDate)}
                />
                <Input
                    name="renewalNote"
                    label="Nota de Renovación"
                    placeholder="Ej. Llamar para pedir descuento"
                    defaultValue={service?.renewalNote || ''}
                />

                {isEditing && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="active"
                            id="active"
                            value="true"
                            defaultChecked={service?.active !== false}
                            className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="active" className="text-sm text-foreground">
                            Servicio Activo
                        </label>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={isLoading}>
                        {isEditing ? 'Guardar Cambios' : 'Crear'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
