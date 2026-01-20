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
import { Modal, Input, Select, Button } from '@/src/components/ui';

interface AddProductButtonProps {
  mode?: 'create' | 'edit';
  product?: Product;
  institutionId?: string;
  institutions?: InstitutionWithProducts[];
  variant?: 'default' | 'menuItem';
  onCloseMenu?: () => void;
}

export default function AddProductButton({
  mode = 'create',
  product,
  institutionId,
  institutions = [],
  variant = 'default',
  onCloseMenu,
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
    if (!product || mode !== 'edit') return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteProduct(product.id);
      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCurrencies = getAvailableCurrencies();

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
            <span className="material-symbols-outlined text-[24px] relative z-10">add_circle</span>
          </div>

          <div className="flex flex-col items-start gap-0.5 relative z-10">
            <span className="font-bold text-[15px] tracking-tight text-white/90 group-hover:text-white transition-colors">
              Nuevo Producto
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-[0.08em] font-bold">
              Cuentas o tarjetas
            </span>
          </div>

          <div className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <span className="material-symbols-outlined text-white/40 text-[20px]">chevron_right</span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-shimmer" />
        </button>
      ) : mode === 'create' ? (
        <Button onClick={() => setIsOpen(true)} variant="primary" size="sm" icon={<span className="material-symbols-outlined">add_circle</span>}>
          Nuevo Producto
        </Button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-white/40 hover:text-blue-400 transition-colors p-1"
          title="Editar producto"
        >
          <span className="material-symbols-outlined text-[20px]">edit_square</span>
        </button>
      )}

      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setError(null);
          }}
          title={mode === 'edit' ? 'Editar Producto' : 'Nuevo Producto'}
          description={mode === 'edit' ? 'Actualiza los detalles de tu producto' : 'Configura una nueva cuenta o tarjeta'}
          icon={<span className="material-symbols-outlined">account_balance_wallet</span>}
          size="md"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Tipo de Producto"
                name="type"
                value={productType}
                onChange={(e) => {
                  const newType = e.target.value as ProductType;
                  setProductType(newType);
                  if (newType === 'CASH') setSelectedInstitutionId(undefined);
                  if (newType !== 'DEBIT_CARD') setLinkedProductId(undefined);
                }}
                required
                disabled={isSubmitting || mode === 'edit'}
              >
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>

              {productType !== 'CASH' && (
                <Select
                  label="Institución"
                  name="institutionId"
                  value={selectedInstitutionId || ''}
                  onChange={(e) => {
                    setSelectedInstitutionId(e.target.value);
                    setLinkedProductId(undefined);
                  }}
                  required
                  disabled={isSubmitting || (mode === 'edit' && !!product?.institutionId) || !!institutionId}
                >
                  <option value="">Seleccionar...</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre del Producto"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Visa Débito"
                required
                disabled={isSubmitting}
              />

              <Select
                label="Moneda"
                name="currency"
                defaultValue={product?.currency || 'ARS'}
                required
                disabled={isSubmitting}
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {CURRENCY_LABELS[currency]}
                  </option>
                ))}
              </Select>
            </div>

            {/* DEBIT CARD LINKING */}
            {productType === 'DEBIT_CARD' && selectedInstitutionId && (
              <div className="p-5 bg-blue-500/10 border border-blue-400/20 rounded-2xl space-y-3">
                <Select
                  label="Vincular a Caja de Ahorro"
                  name="linkedProductId"
                  value={linkedProductId || (availableSavingsAccounts.length === 1 ? availableSavingsAccounts[0].id : '')}
                  onChange={(e) => setLinkedProductId(e.target.value)}
                  required
                  disabled={isSubmitting || availableSavingsAccounts.length <= 1}
                >
                  <option value="" className="bg-slate-800">Seleccionar cuenta...</option>
                  {availableSavingsAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-slate-800">
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </Select>
                {availableSavingsAccounts.length === 0 && (
                  <p className="text-xs text-red-400 ml-1 italic">
                    * Esta institución no tiene cajas de ahorro. Crea una primero.
                  </p>
                )}
                {availableSavingsAccounts.length === 1 && (
                  <p className="text-[10px] text-blue-300 ml-1 italic">
                    * Seleccionada automáticamente.
                  </p>
                )}
              </div>
            )}

            {(productType === 'CREDIT_CARD' || productType === 'DEBIT_CARD') && (
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Últimos 4 dígs"
                  name="lastFourDigits"
                  maxLength={4}
                  pattern="\d{4}"
                  defaultValue={product?.lastFourDigits || ''}
                  placeholder="Ej: 1234"
                />
                {productType === 'CREDIT_CARD' && (
                  <Select
                    label="Proveedor"
                    name="provider"
                    defaultValue={product?.provider || 'VISA'}
                  >
                    {Object.entries(CARD_PROVIDER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {productType !== 'DEBIT_CARD' && (
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                <Input
                  label={productType === 'CREDIT_CARD' || productType === 'LOAN' ? 'Deuda Actual' : 'Saldo Inicial'}
                  type="number"
                  name="balance"
                  step="0.01"
                  defaultValue={product?.balance || 0}
                  required
                  disabled={isSubmitting || mode === 'edit'}
                />
                <p className="mt-2 text-[10px] text-white/40 ml-1">
                  {mode === 'edit'
                    ? '* El saldo se modifica mediante transacciones'
                    : productType === 'CREDIT_CARD' || productType === 'LOAN'
                      ? '* Ingrese valores negativos para deuda (ej: -1500)'
                      : '* Saldo disponible al momento de crear'}
                </p>
              </div>
            )}

            {productType === 'LOAN' && (
              <Input
                label="Límite Disponible del Préstamo"
                type="number"
                name="limit"
                step="0.01"
                defaultValue={product?.limit || ''}
                required
                disabled={isSubmitting}
              />
            )}

            {productType === 'CREDIT_CARD' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={unifiedLimit ? "Límite Total" : "Límite Un Pago"}
                    type="number"
                    name="limitSinglePayment"
                    step="0.01"
                    defaultValue={hasSharedLimit ? (sharedLimitSinglePayment || '') : (product?.limitSinglePayment || product?.limit || '')}
                    required
                    disabled={isSubmitting || hasSharedLimit}
                  />
                  {!unifiedLimit && (
                    <Input
                      label="Límite Cuotas"
                      type="number"
                      name="limitInstallments"
                      step="0.01"
                      defaultValue={hasSharedLimit ? (sharedLimitInstallments || '') : (product?.limitInstallments || product?.limit || '')}
                      required
                      disabled={isSubmitting || hasSharedLimit}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Día de Cierre"
                    type="number"
                    name="closingDay"
                    min="1"
                    max="31"
                    defaultValue={product?.closingDay || ''}
                    required
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Día de Vencimiento"
                    type="number"
                    name="dueDay"
                    min="1"
                    max="31"
                    defaultValue={product?.dueDay || ''}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  {!hasSharedLimit && (
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={sharedLimit}
                        onChange={(e) => setSharedLimit(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-white/30 bg-transparent text-blue-500 focus:ring-blue-500/20"
                      />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-tight">Compartir límite</span>
                    </label>
                  )}
                  <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={unifiedLimit}
                      onChange={(e) => setUnifiedLimit(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-white/30 bg-transparent text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-xs font-bold text-white/60 uppercase tracking-tight">Límite unificado</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="flex-[2]"
                icon={<span className="material-symbols-outlined">check_circle</span>}
              >
                {mode === 'edit' ? 'Guardar Cambios' : 'Crear Producto'}
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
                    <div className="flex gap-2 w-full animate-in slide-in-from-right-2">
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
