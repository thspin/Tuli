'use client'

import { Product, CARD_PROVIDER_LOGOS, PRODUCT_TYPE_LABELS } from '@/src/types';
import { getCurrencySymbol } from '@/src/utils/validations';

interface ProductCardProps {
    product: Product;
    institutionName: string;
    onClick: () => void;
    isSelected?: boolean;
}

// Paleta de colores SOBRIA y PROFESIONAL
const CARD_COLORS: Record<string, string> = {
    // Instituciones argentinas específicas
    'naranja': 'from-purple-900 via-violet-900 to-purple-950',
    'galicia': 'from-orange-800 via-orange-900 to-orange-950',
    'bbva': 'from-blue-900 via-blue-950 to-slate-950',
    'santander': 'from-red-900 via-red-950 to-slate-950',
    'macro': 'from-red-900 via-red-950 to-gray-950',
    'nacion': 'from-blue-950 via-slate-950 to-gray-950',
    'provincia': 'from-green-900 via-green-950 to-slate-950',
    'icbc': 'from-red-900 via-rose-950 to-gray-950',
    'hsbc': 'from-red-900 via-red-950 to-slate-950',
    'ciudad': 'from-orange-900 via-amber-950 to-slate-950',
    'patagonia': 'from-blue-900 via-blue-950 to-slate-950',
    'supervielle': 'from-blue-800 via-blue-950 to-slate-950',
    'itau': 'from-orange-800 via-orange-950 to-slate-950',
    'comafi': 'from-blue-900 via-slate-950 to-gray-950',

    // Billeteras virtuales
    'mercadopago': 'from-sky-800 via-blue-900 to-slate-950',
    'uala': 'from-violet-900 via-purple-950 to-slate-950',
    'brubank': 'from-pink-900 via-pink-950 to-slate-950',
    'astropay': 'from-slate-900 via-gray-950 to-black',
    'naranjax': 'from-purple-900 via-violet-950 to-slate-950',

    // Por proveedor
    'visa': 'from-blue-900 via-indigo-950 to-slate-950',
    'mastercard': 'from-amber-900 via-orange-950 to-slate-950',
    'amex': 'from-slate-800 via-gray-900 to-slate-950',

    // Default sobrio
    'default': 'from-slate-800 via-slate-900 to-slate-950'
};

function getCardGradient(institutionName: string, provider?: string | null): string {
    const name = institutionName.toLowerCase();
    const prov = provider?.toLowerCase() || '';

    // Buscar por nombre de institución primero
    for (const [key, gradient] of Object.entries(CARD_COLORS)) {
        if (name.includes(key)) {
            return gradient;
        }
    }

    // Buscar por proveedor
    for (const [key, gradient] of Object.entries(CARD_COLORS)) {
        if (prov.includes(key)) {
            return gradient;
        }
    }

    return CARD_COLORS.default;
}

export default function ProductCard({ product, institutionName, onClick, isSelected }: ProductCardProps) {
    const gradientColors = getCardGradient(institutionName, product.provider);
    const isCredit = product.type === 'CREDIT_CARD';
    const isDebit = product.type === 'DEBIT_CARD';
    const showCardDesign = isCredit || isDebit;

    // Formatear número de tarjeta
    const cardNumber = product.lastFourDigits
        ? `•••• •••• •••• ${product.lastFourDigits}`
        : '•••• •••• •••• ••••';

    // Formatear fecha de vencimiento más realista
    const currentYear = new Date().getFullYear();
    const expiryMonth = product.closingDay ? String(product.closingDay).padStart(2, '0') : '12';
    const expiryYear = String((currentYear + 5) % 100).padStart(2, '0');
    const expiryDate = `${expiryMonth}/${expiryYear}`;

    if (!showCardDesign) {
        // Diseño simplificado para productos no-tarjeta
        return (
            <div
                onClick={onClick}
                className={`
                    relative rounded-2xl p-6 cursor-pointer
                    transition-all duration-200 ease-in-out
                    hover:scale-[1.02] hover:shadow-2xl
                    ${isSelected ? 'ring-2 ring-primary shadow-2xl scale-[1.02]' : 'shadow-lg'}
                    bg-gradient-to-br ${gradientColors}
                    text-white overflow-hidden
                `}
            >
                {/* Marca de agua sutil */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <div className="text-9xl font-bold transform -rotate-12 select-none">
                        {institutionName.substring(0, 4).toUpperCase()}
                    </div>
                </div>

                <div className="relative flex flex-col h-full justify-between z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-base mb-1 text-white/95">{institutionName}</h3>
                            <p className="text-sm text-white/80">{product.name}</p>
                        </div>
                        <span className="text-2xl opacity-90">{getCurrencySymbol(product.currency)}</span>
                    </div>

                    <div className="mt-6">
                        <p className="text-xs text-white/70 mb-1">Saldo</p>
                        <p className="text-2xl font-bold text-white">
                            {getCurrencySymbol(product.currency)} {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-white/70 uppercase tracking-wide">{PRODUCT_TYPE_LABELS[product.type]}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl cursor-pointer
                transition-all duration-200 ease-in-out
                hover:scale-[1.02]
                ${isSelected ? 'ring-2 ring-primary shadow-2xl scale-[1.02]' : 'shadow-lg hover:shadow-2xl'}
            `}
            style={{ aspectRatio: '1.586' }}
        >
            {/* Fondo con gradiente sobrio diagonal */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors}`} />

            {/* Marca de agua decorativa MUY SUTIL */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.06] pointer-events-none">
                <div
                    className="text-[160px] font-bold text-white transform -rotate-15 select-none"
                    style={{ lineHeight: 1 }}
                >
                    {institutionName.split(' ')[0].substring(0, 6).toUpperCase()}
                </div>
            </div>

            {/* Contenido de la tarjeta */}
            <div className="relative h-full flex flex-col justify-between p-5 md:p-6 text-white z-10">
                {/* Header: Nombre institución (izquierda) y logo proveedor (derecha) */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-base md:text-[17px] tracking-tight text-white/95">
                            {institutionName}
                        </h3>
                    </div>

                    {/* Logo del proveedor - MÁS PEQUEÑO y SUTIL */}
                    {product.provider && CARD_PROVIDER_LOGOS[product.provider] && (
                        <div className="bg-white/95 rounded px-2 py-1 flex items-center justify-center shadow-sm">
                            <img
                                src={CARD_PROVIDER_LOGOS[product.provider]}
                                alt={product.provider}
                                className="h-5 md:h-6 w-auto object-contain opacity-90"
                            />
                        </div>
                    )}
                </div>

                {/* Espaciador flex */}
                <div className="flex-1" />

                {/* Footer: Número, Vencimiento y Tipo */}
                <div className="space-y-3">
                    {/* Número de tarjeta */}
                    <div>
                        <p
                            className="font-mono text-lg md:text-[22px] tracking-[0.15em] font-medium text-white/95"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            {cardNumber}
                        </p>
                    </div>

                    {/* Vencimiento y Tipo en la misma línea */}
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] md:text-xs text-white/60 uppercase tracking-wide mb-0.5">Vence</p>
                            <p className="font-mono text-xs md:text-sm tracking-wider text-white/90">
                                {expiryDate}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-white/90">
                                {isCredit ? 'Crédito' : 'Débito'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Brillo sutil en hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
    );
}
