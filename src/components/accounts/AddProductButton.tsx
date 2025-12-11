'use client'

import { useState, useEffect } from 'react';
import { createProduct, updateProduct, deleteProduct } from '@/src/actions/accounts/account-actions';
import {
  Product,
  InstitutionWithProducts,
  ProductType,
  Currency,
  PRODUCT_TYPE_LABELS,
  CURRENCY_LABELS,
  CardProvider,
  CARD_PROVIDER_LABELS,
  CARD_PROVIDER_LOGOS
} from '@/src/types';
import { Modal, Button } from '@/src/components/ui';

interface AddProductButtonProps {
  mode?: 'create' | 'edit';
  product?: Product;
  institutionId?: string;
  institutions?: InstitutionWithProducts[];
}

export default function AddProductButton({
  mode = 'create',
  product,
  institutionId,
  institutions = [],
}: AddProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [productType, setProductType] = useState<ProductType>(product?.type || 'SAVINGS_ACCOUNT');
  const [name, setName] = useState(product?.name || PRODUCT_TYPE_LABELS[product?.type || 'SAVINGS_ACCOUNT']);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | undefined>(
    product?.institutionId || institutionId || undefined
  );
  const [linkedProductId, setLinkedProductId] = useState<string | undefined>(product?.linkedProductId || undefined);
  const [sharedLimit, setSharedLimit] = useState<boolean>(product?.sharedLimit || false);
  const [unifiedLimit, setUnifiedLimit] = useState<boolean>(product?.unifiedLimit || false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedInstitution = institutions.find((inst) => inst.id === selectedInstitutionId);

  // Update name when product type changes in create mode
  useEffect(() => {
    if (mode === 'create') {
      setName(PRODUCT_TYPE_LABELS[productType]);
    }
  }, [productType, mode]);

  // Verificar si la institución tiene una tarjeta con límite compartido
  const sharedLimitCard = selectedInstitution?.products?.find(
    p => p.type === 'CREDIT_CARD' && p.sharedLimit && p.id !== product?.id
  );
  const hasSharedLimit = !!sharedLimitCard;
  const sharedLimitSinglePayment = sharedLimitCard?.limitSinglePayment || sharedLimitCard?.limit;
  const sharedLimitInstallments = sharedLimitCard?.limitInstallments || sharedLimitCard?.limit;

  // Filtrar cajas de ahorro disponibles para vincular tarjeta de débito
  const availableSavingsAccounts = selectedInstitution?.products?.filter(
    p => p.type === 'SAVINGS_ACCOUNT'
  ) || [];

  // Auto-seleccionar caja de ahorro si es la única
  useEffect(() => {
    if (productType === 'DEBIT_CARD' && availableSavingsAccounts.length === 1 && !linkedProductId) {
      setLinkedProductId(availableSavingsAccounts[0].id);
    }
  }, [productType, availableSavingsAccounts, linkedProductId]);

  // Determinar monedas disponibles según institución
  const getAvailableCurrencies = (): Currency[] => {
    // ... (existing code)
    if (productType === 'CASH') {
      return ['ARS', 'USD'];
    }

    if (!selectedInstitution) {
      return ['ARS', 'USD'];
    }

    if (selectedInstitution.type === 'BANK') {
      return ['ARS', 'USD'];
    }

    if (selectedInstitution.type === 'WALLET') {
      return ['ARS', 'USD', 'USDT', 'USDC', 'BTC'];
    }

    return ['ARS', 'USD'];
  };

  // Effect for auto-selecting savings account
  // Note: I can't easily add useEffect here without changing the whole file structure or imports.
  // I'll try to do it in one go or use a separate tool call for imports.
  // Let's assume I can add the logic inside the render or just use a callback, but useEffect is better.

  // Let's rewrite the component start to include useEffect and the new logic.

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // En modo edición, agregar campos deshabilitados manualmente
    if (mode === 'edit' && product) {
      formData.set('type', product.type);
      formData.set('balance', product.balance.toString());
    }

    // Agregar sharedLimit y unifiedLimit como string para tarjetas de crédito
    if (productType === 'CREDIT_CARD') {
      const shouldShareLimit = hasSharedLimit || sharedLimit;
      formData.set('sharedLimit', shouldShareLimit.toString());
      formData.set('unifiedLimit', unifiedLimit.toString());

      if (hasSharedLimit) {
        if (sharedLimitSinglePayment) {
          formData.set('limitSinglePayment', sharedLimitSinglePayment.toString());
        }
        if (sharedLimitInstallments) {
          formData.set('limitInstallments', sharedLimitInstallments.toString());
        }
      } else if (unifiedLimit) {
        // Si es un límite unificado, usar el valor del primer campo para ambos
        const unifiedLimitValue = formData.get('limitSinglePayment') as string;
        if (unifiedLimitValue) {
          formData.set('limitInstallments', unifiedLimitValue);
        }
      }
    }

    // Logic for DEBIT_CARD
    if (productType === 'DEBIT_CARD') {
      // Balance is 0 for debit cards
      formData.set('balance', '0');

      if (linkedProductId) {
        formData.set('linkedProductId', linkedProductId);
      } else if (availableSavingsAccounts.length === 1) {
        // Fallback if state wasn't updated but logic dictates
        formData.set('linkedProductId', availableSavingsAccounts[0].id);
      }
    }

    // Agregar institutionId si aplica
    if (productType !== 'CASH' && selectedInstitutionId) {
      formData.set('institutionId', selectedInstitutionId);
    }

    try {
      let result;
      if (mode === 'edit' && product) {
        result = await updateProduct(product.id, formData);
      } else {
        result = await createProduct(formData);
      }

      if (result.success) {
        setIsOpen(false);
        form.reset();
        setProductType('SAVINGS_ACCOUNT');
        setSelectedInstitutionId(institutionId);
        setLinkedProductId(undefined);
        setName(PRODUCT_TYPE_LABELS['SAVINGS_ACCOUNT']);
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Client submission error:', err);
      setError(`Error al procesar la solicitud: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    console.log('handleDelete called', { product, mode });
    if (!product || mode !== 'edit') {
      console.log('handleDelete returning early: invalid product or mode');
      return;
    }

    // Confirmación ya manejada por UI state
    console.log('handleDelete proceeding with deletion');
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteProduct(product.id);
      console.log('deleteProduct result:', result);

      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error || 'Error al eliminar');
      }
    } catch (err) {
      console.error('deleteProduct error:', err);
      setError('Error al eliminar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCurrencies = getAvailableCurrencies();

  // Auto-select effect logic (simulated in render or added via replace)
  if (productType === 'DEBIT_CARD' && availableSavingsAccounts.length === 1 && !linkedProductId) {
    // This is a side effect in render, which is bad practice but might work for a quick fix. 
    // Better to use useEffect. I will add useEffect in the imports.
    // For now, I'll rely on the user selecting it or the fallback in handleSubmit, 
    // BUT the prompt says "la app seleccionara esta por default y no preguntara".
    // So I should set the default value in the state or the select.
  }

  return (
    <>
      {mode === 'create' ? (
        <Button onClick={() => setIsOpen(true)} variant="primary">
          + Nuevo Producto
        </Button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-gray-400 hover:text-blue-600 transition-colors p-1"
          title="Editar producto"
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
          title={mode === 'edit' ? 'Editar Producto' : 'Nuevo Producto Financiero'}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Producto
              </label>
              <select
                name="type"
                value={productType}
                onChange={(e) => {
                  const newType = e.target.value as ProductType;
                  setProductType(newType);
                  if (newType === 'CASH') {
                    setSelectedInstitutionId(undefined);
                  }
                  // Reset linked product when type changes
                  if (newType !== 'DEBIT_CARD') {
                    setLinkedProductId(undefined);
                  }
                }}
                required
                disabled={isSubmitting || mode === 'edit'}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {productType !== 'CASH' && mode === 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institución
                </label>
                <select
                  name="institutionId"
                  value={selectedInstitutionId || ''}
                  onChange={(e) => {
                    setSelectedInstitutionId(e.target.value);
                    setLinkedProductId(undefined); // Reset when institution changes
                  }}
                  required
                  disabled={isSubmitting || !!institutionId}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Seleccionar institución...</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.type === 'BANK' ? 'Banco' : 'Billetera'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DEBIT CARD LINKING */}
            {productType === 'DEBIT_CARD' && selectedInstitutionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vincular a Caja de Ahorro
                </label>
                {availableSavingsAccounts.length === 0 ? (
                  <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
                    Esta institución no tiene cajas de ahorro. Debes crear una primero.
                  </div>
                ) : (
                  <select
                    name="linkedProductId"
                    value={linkedProductId || (availableSavingsAccounts.length === 1 ? availableSavingsAccounts[0].id : '')}
                    onChange={(e) => setLinkedProductId(e.target.value)}
                    required
                    disabled={isSubmitting || availableSavingsAccounts.length === 1}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {availableSavingsAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency}) - Saldo: ${acc.balance}
                      </option>
                    ))}
                  </select>
                )}
                {availableSavingsAccounts.length === 1 && (
                  <p className="mt-1 text-xs text-blue-600">
                    Seleccionada automáticamente (única cuenta disponible)
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Visa Débito"
                required
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {(productType === 'CREDIT_CARD' || productType === 'DEBIT_CARD') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Últimos 4 dígitos
                  </label>
                  <input
                    type="text"
                    name="lastFourDigits"
                    maxLength={4}
                    pattern="\d{4}"
                    defaultValue={product?.lastFourDigits || ''}
                    placeholder="Ej: 1234"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {productType === 'CREDIT_CARD' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor
                    </label>
                    <select
                      name="provider"
                      defaultValue={product?.provider || 'VISA'}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(CARD_PROVIDER_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                name="currency"
                defaultValue={product?.currency || 'ARS'}
                required
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {CURRENCY_LABELS[currency]}
                  </option>
                ))}
              </select>
            </div>

            {/* Hide balance for Debit Card */}
            {productType !== 'DEBIT_CARD' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo {productType === 'CREDIT_CARD' || productType === 'LOAN' ? 'Actual (deuda)' : 'Inicial'}
                </label>
                <input
                  type="number"
                  name="balance"
                  step="0.01"
                  defaultValue={product?.balance || 0}
                  required
                  disabled={isSubmitting || mode === 'edit'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                {mode === 'edit' && (
                  <p className="mt-1 text-xs text-gray-500">
                    El saldo se modifica mediante transacciones
                  </p>
                )}
                {mode === 'create' && (productType === 'CREDIT_CARD' || productType === 'LOAN') && (
                  <p className="mt-1 text-xs text-gray-500">
                    Ingrese valores negativos para deuda (ej: -1500)
                  </p>
                )}
              </div>
            )}

            {productType === 'DEBIT_CARD' && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                ℹ️ Las tarjetas de débito no tienen saldo propio. Utilizan el saldo de la caja de ahorro vinculada.
              </div>
            )}

            {/* ... (rest of the form) */}


            {productType === 'LOAN' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite Disponible del Préstamo
                </label>
                <input
                  type="number"
                  name="limit"
                  step="0.01"
                  defaultValue={product?.limit || ''}
                  required
                  disabled={isSubmitting}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Monto máximo que se puede solicitar en el préstamo
                </p>
              </div>
            )}

            {productType === 'CREDIT_CARD' && (
              <>
                {unifiedLimit ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Límite de Crédito
                    </label>
                    <input
                      type="number"
                      name="limitSinglePayment"
                      step="0.01"
                      defaultValue={hasSharedLimit ? (sharedLimitSinglePayment || '') : (product?.limitSinglePayment || product?.limit || '')}
                      required
                      disabled={isSubmitting || hasSharedLimit}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Este límite se comparte entre compras en cuotas y en 1 pago
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Límite en Un Pago
                      </label>
                      <input
                        type="number"
                        name="limitSinglePayment"
                        step="0.01"
                        defaultValue={hasSharedLimit ? (sharedLimitSinglePayment || '') : (product?.limitSinglePayment || product?.limit || '')}
                        required
                        disabled={isSubmitting || hasSharedLimit}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Para compras en una sola cuota
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Límite en Cuotas
                      </label>
                      <input
                        type="number"
                        name="limitInstallments"
                        step="0.01"
                        defaultValue={hasSharedLimit ? (sharedLimitInstallments || '') : (product?.limitInstallments || product?.limit || '')}
                        required
                        disabled={isSubmitting || hasSharedLimit}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Para compras en cuotas
                      </p>
                    </div>
                  </div>
                )}

                {hasSharedLimit && (
                  <p className="mt-1 text-xs text-blue-600">
                    Esta tarjeta comparte los límites con otras tarjetas de {selectedInstitution?.name}
                  </p>
                )}

                {!hasSharedLimit && (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="sharedLimit"
                        name="sharedLimit"
                        checked={sharedLimit}
                        onChange={(e) => setSharedLimit(e.target.checked)}
                        disabled={isSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="sharedLimit" className="text-sm text-gray-700 cursor-pointer">
                        Compartir límite con otras tarjetas de esta institución
                      </label>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="unifiedLimit"
                        name="unifiedLimit"
                        checked={unifiedLimit}
                        onChange={(e) => setUnifiedLimit(e.target.checked)}
                        disabled={isSubmitting}
                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <label htmlFor="unifiedLimit" className="text-sm text-gray-700 cursor-pointer">
                        Usar mismo límite para cuotas y 1 pago
                      </label>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día de Cierre
                    </label>
                    <input
                      type="number"
                      name="closingDay"
                      min="1"
                      max="31"
                      defaultValue={product?.closingDay || ''}
                      required
                      disabled={isSubmitting}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día de Vencimiento
                    </label>
                    <input
                      type="number"
                      name="dueDay"
                      min="1"
                      max="31"
                      defaultValue={product?.dueDay || ''}
                      required
                      disabled={isSubmitting}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : mode === 'edit' ? 'Guardar Cambios' : 'Crear Producto'}
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
