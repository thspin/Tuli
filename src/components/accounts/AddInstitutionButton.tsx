'use client'

import { useState } from 'react';
import { createInstitution, updateInstitution, deleteInstitution } from '@/src/actions/accounts/account-actions';
import { Institution } from '@/src/types';
import { Modal, Button } from '@/src/components/ui';

interface AddInstitutionButtonProps {
  mode?: 'create' | 'edit';
  institution?: Institution;
}

export default function AddInstitutionButton({ mode = 'create', institution }: AddInstitutionButtonProps) {
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

    // Confirmación manejada por UI
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
      {mode === 'create' ? (
        <Button onClick={() => setIsOpen(true)} variant="primary">
          + Nueva Institución
        </Button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-gray-400 hover:text-blue-600 transition-colors p-1"
          title="Editar institución"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setError(null);
          }}
          title={mode === 'edit' ? 'Editar Institución' : 'Nueva Institución Financiera'}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Institución
              </label>
              <input
                type="text"
                name="name"
                defaultValue={institution?.name}
                placeholder="Ej: Banco Galicia, Mercado Pago"
                required
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Institución
              </label>
              <select
                name="type"
                defaultValue={institution?.type || 'BANK'}
                required
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="BANK">Banco</option>
                <option value="WALLET">Billetera Virtual</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Los bancos permiten ARS y USD. Las billeteras virtuales también permiten crypto.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : mode === 'edit' ? 'Guardar Cambios' : 'Crear Institución'}
              </button>

              {mode === 'edit' && (
                <>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      disabled={isSubmitting}
                      className="px-4 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowDeleteConfirm(false);
                        }}
                        disabled={isSubmitting}
                        className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete();
                        }}
                        disabled={isSubmitting}
                        className="px-3 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        Confirmar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
