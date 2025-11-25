'use client'

import { useState } from 'react';
import { createProduct, updateProduct, deleteProduct } from './actions';

type ProductType = 'CASH' | 'SAVINGS_ACCOUNT' | 'CHECKING_ACCOUNT' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'LOAN';
type Currency = 'ARS' | 'USD' | 'USDT' | 'USDC' | 'BTC';

interface Institution {
  id: string;
  name: string;
  type: 'BANK' | 'WALLET';
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  type: ProductType;
  currency: Currency;
  balance: number;
  closingDay?: number | null;
  dueDay?: number | null;
  limit?: number | null;
  sharedLimit?: boolean;
  institutionId?: string | null;
}

interface AddProductButtonProps {
  mode?: 'create' | 'edit';
  product?: Product;
  institutionId?: string;
  institutions?: Institution[];
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  CASH: 'Efectivo',
  SAVINGS_ACCOUNT: 'Caja de Ahorro',
  CHECKING_ACCOUNT: 'Cuenta Corriente',
  DEBIT_CARD: 'Tarjeta de Débito',
  CREDIT_CARD: 'Tarjeta de Crédito',
  LOAN: 'Préstamo',
};

const CURRENCY_LABELS: Record<Currency, string> = {
  ARS: 'Peso Argentino (ARS)',
  USD: 'Dólar (USD)',
  USDT: 'Tether (USDT)',
  USDC: 'USD Coin (USDC)',
  BTC: 'Bitcoin (BTC)',
};

export default function AddProductButton({
  mode = 'create',
  product,
  institutionId,
  institutions = [],
}: AddProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [productType, setProductType] = useState<ProductType>(product?.type || 'SAVINGS_ACCOUNT');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | undefined>(
    product?.institutionId || institutionId || undefined
  );
  const [sharedLimit, setSharedLimit] = useState<boolean>(product?.sharedLimit || false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedInstitution = institutions.find((inst) => inst.id === selectedInstitutionId);

  // Verificar si la institución tiene una tarjeta con límite compartido
  const sharedLimitCard = selectedInstitution?.products?.find(
    p => p.type === 'CREDIT_CARD' && p.sharedLimit && p.id !== product?.id
  );
  const hasSharedLimit = !!sharedLimitCard;
  const sharedLimitAmount = sharedLimitCard?.limit;

  // Determinar monedas disponibles según institución
  const getAvailableCurrencies = (): Currency[] => {
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

    // Agregar sharedLimit como string para tarjetas de crédito
    if (productType === 'CREDIT_CARD') {
      // Si ya existe un límite compartido en la institución, forzar sharedLimit=true
      const shouldShareLimit = hasSharedLimit || sharedLimit;
      formData.set('sharedLimit', shouldShareLimit.toString());

      // Si tiene límite compartido, agregar el límite manualmente porque el campo está deshabilitado
      if (hasSharedLimit && sharedLimitAmount) {
        formData.set('limit', sharedLimitAmount.toString());
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

  return (
    <>
      {mode === 'create' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          + Nuevo Producto
        </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'edit' ? 'Editar Producto' : 'Nuevo Producto Financiero'}
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>

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
                    setProductType(e.target.value as ProductType);
                    if (e.target.value === 'CASH') {
                      setSelectedInstitutionId(undefined);
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
                    onChange={(e) => setSelectedInstitutionId(e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={product?.name}
                  placeholder="Ej: Visa Gold, Cuenta en Dólares"
                  required
                  disabled={isSubmitting}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Límite de Crédito
                    </label>
                    <input
                      type="number"
                      name="limit"
                      step="0.01"
                      defaultValue={hasSharedLimit ? (sharedLimitAmount || '') : (product?.limit || '')}
                      required
                      disabled={isSubmitting || hasSharedLimit}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    {hasSharedLimit && (
                      <p className="mt-1 text-xs text-blue-600">
                        Esta tarjeta comparte el límite con otras tarjetas de {selectedInstitution?.name}
                      </p>
                    )}
                  </div>

                  {!hasSharedLimit && (
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
          </div>
        </div>
      )}
    </>
  );
}
