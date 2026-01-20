'use client'

import { useState } from 'react';
import { createInstitution, updateInstitution, deleteInstitution } from '@/src/actions/accounts/account-actions';
import { Institution } from '@/src/types';
import { Modal, Input, Select, Button } from '@/src/components/ui';

interface AddInstitutionButtonProps {
  mode?: 'create' | 'edit';
  institution?: Institution;
  variant?: 'default' | 'menuItem';
  onCloseMenu?: () => void;
}

export default function AddInstitutionButton({ mode = 'create', institution, variant = 'default', onCloseMenu }: AddInstitutionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      let result;
      if (mode === 'edit' && institution) {
        result = await updateInstitution(institution.id, formData);
      } else {
        result = await createInstitution(formData);
      }

      if (result.success) {
        setIsOpen(false);
        e.currentTarget.reset();
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err) {
      setError('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!institution || mode !== 'edit') return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteInstitution(institution.id);

      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar la institución');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {variant === 'menuItem' ? (
        <button
          onClick={() => {
            setIsOpen(true);
            onCloseMenu?.();
          }}
          className="w-full flex items-center gap-4 px-4 py-4 text-sm text-white hover:bg-white/[0.08] transition-all duration-300 rounded-2xl group relative overflow-hidden"
        >
          <div className="relative flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="material-symbols-outlined text-[24px] relative z-10">account_balance</span>
          </div>

          <div className="flex flex-col items-start gap-0.5 relative z-10">
            <span className="font-bold text-[15px] tracking-tight text-white/90 group-hover:text-white transition-colors">
              Nueva Institución
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-[0.08em] font-bold">
              Bancos o billeteras
            </span>
          </div>

          <div className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <span className="material-symbols-outlined text-white/40 text-[20px]">chevron_right</span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-shimmer" />
        </button>
      ) : mode === 'create' ? (
        <Button onClick={() => setIsOpen(true)} variant="primary" size="sm" icon={<span className="material-symbols-outlined">add_circle</span>}>
          Nueva Institución
        </Button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-white/40 hover:text-blue-400 transition-colors p-1"
          title="Editar institución"
        >
          <span className="material-symbols-outlined">edit_square</span>
        </button>
      )}

      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setError(null);
          }}
          title={mode === 'edit' ? 'Editar Institución' : 'Nueva Institución'}
          description={mode === 'edit' ? 'Modifica los datos de la entidad' : 'Registra un nuevo banco o billetera'}
          icon={<span className="material-symbols-outlined">account_balance</span>}
          size="sm"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nombre de la Institución"
              name="name"
              defaultValue={institution?.name}
              placeholder="Ej: Banco Galicia, Mercado Pago"
              required
              disabled={isSubmitting}
            />

            <div className="space-y-3">
              <Select
                label="Tipo de Institución"
                name="type"
                defaultValue={institution?.type || 'BANK'}
                required
                disabled={isSubmitting}
              >
                <option value="BANK" className="bg-slate-800">🏦 Banco</option>
                <option value="WALLET" className="bg-slate-800">📱 Billetera Virtual</option>
              </Select>

              {/* Unified Summary Toggle - Glass Style */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mt-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Resumen Unificado</h4>
                  <p className="text-xs text-white/50">
                    Todas las tarjetas comparten el mismo resumen
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="shareSummary"
                    value="true"
                    defaultChecked={institution?.shareSummary || false}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <p className="px-2 text-[10px] text-white/40 leading-relaxed italic mt-2">
                * Los bancos permiten ARS y USD. Las billeteras virtuales también permiten crypto.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="flex-[2]"
                icon={<span className="material-symbols-outlined">check_circle</span>}
              >
                {mode === 'edit' ? 'Guardar Cambios' : 'Crear Institución'}
              </Button>

              {mode === 'edit' && (
                <div className="flex-1 flex">
                  {!showDeleteConfirm ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      Eliminar
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        No
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        Sí
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
