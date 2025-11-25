'use client'

import { formatNumber } from '@/lib/validations';

interface ExchangeRateDisplayProps {
  usdToArs: number | null;
}

export default function ExchangeRateDisplay({ usdToArs }: ExchangeRateDisplayProps) {
  if (!usdToArs) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        ⚠️ Tipo de cambio no disponible
      </div>
    );
  }

  const arsToUsd = 1 / usdToArs;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-blue-900">Tipo de Cambio:</span>
          <span className="text-blue-700">
            US$ 1 = $ {formatNumber(usdToArs, 2)}
          </span>
        </div>
        <div className="text-blue-600 text-xs">
          $ 1 = US$ {formatNumber(arsToUsd, 4)}
        </div>
      </div>
    </div>
  );
}
