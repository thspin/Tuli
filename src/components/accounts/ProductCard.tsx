'use client'

import { format } from 'date-fns';
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

    // Logic: Is this visually a card?
    const isCredit = product.type === 'CREDIT_CARD';
    const isDebit = product.type === 'DEBIT_CARD';

    // Check if it is AstroPay
    const isAstro = institutionName.toLowerCase().includes('astropay') || institutionName.toLowerCase().includes('astro pay');

    // Only show card design if it's actually a card TYPE
    const showCardDesign = isCredit || isDebit;

    // Formatear número de tarjeta
    const cardNumber = product.lastFourDigits
        ? `•••• •••• •••• ${product.lastFourDigits}`
        : '•••• •••• •••• 5918';

    // Formatear fecha de vencimiento (plástico)
    const expiryDate = product.expirationDate
        ? format(new Date(product.expirationDate), 'MM/yy')
        : '12/29'; // Placeholder realista

    // 1. Render as Account (White Box) if it's not a card design
    // This will handle AstroPay Savings Accounts correctly now (White boxes)
    if (!showCardDesign) {
        return (
            <div
                onClick={onClick}
                className={`
                    relative rounded-[20px] p-0 cursor-pointer
                    transition-all duration-300 ease-out
                    group overflow-hidden bg-white border border-slate-200
                    ${isSelected
                        ? 'ring-2 ring-blue-600 shadow-xl shadow-blue-100'
                        : 'hover:border-slate-300 hover:shadow-lg'
                    }
                    flex flex-col h-[180px] min-w-[300px]
                `}
            >
                {/* Top Section: Content */}
                <div className="flex-1 p-5 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-600 text-sm font-semibold tracking-wide">
                            {product.name}
                        </h3>
                    </div>
                    <div className="mt-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-400">
                                {getCurrencySymbol(product.currency)}
                            </span>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(',')[0]}
                            </span>
                            <span className="text-xl font-bold text-slate-400">
                                ,{product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(',')[1]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Footer/Info */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">
                        {product.type === 'SAVINGS_ACCOUNT' ? 'savings' : 'wallet'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 font-mono">
                        •••• {product.id.slice(-4)}
                    </span>
                </div>

                {/* Selection Checkmark */}
                {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                        <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                    </div>
                )}
                <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${product.type === 'LOAN' ? 'from-red-500/0 via-red-500/30 to-red-500/0' : 'from-blue-500/0 via-blue-500/30 to-blue-500/0'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            </div>
        );
    }

    // 2. Render Special AstroPay Debit Card (Messi Design)
    // Only enters here if showCardDesign is true (so it is a Debit/Credit card) AND it is AstroPay
    if (isAstro) {
        return (
            <div
                onClick={onClick}
                className={`
                    relative overflow-hidden rounded-[18px] cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.02] transform group
                    ${isSelected ? 'ring-2 ring-emerald-400 shadow-2xl' : 'shadow-xl'}
                `}
                style={{
                    aspectRatio: '1.586',
                    background: 'linear-gradient(110deg, #00C4B4 0%, #005F57 100%)', // Base teal gradient
                    boxShadow: '0 10px 30px -10px rgba(0, 196, 180, 0.5)'
                }}
            >
                {/* Messi Background Image & 10 */}
                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                    {/* Background Number 10 - Massive & Faded */}
                    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[260px] font-black leading-none text-white opacity-[0.15] tracking-tighter scale-150 blur-sm mix-blend-overlay">
                        10
                    </div>

                    {/* Messi Image - Using a highly reliable public URL (placeholder vibe) */}
                    {/* We use a classic Messi render or similar. Since I cannot upload files, I rely on a stable URL */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg"
                        alt="Messi"
                        className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[110%] h-[120%] object-cover object-top opacity-60 mix-blend-luminosity grayscale-[0.2] contrast-125"
                        style={{
                            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', // Fade out bottom
                        }}
                    />

                    {/* Teal Tint Overlay & Smoke Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#00C4B4] via-[#00C4B4]/40 to-transparent mix-blend-color opacity-80"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#005F57] via-transparent to-transparent opacity-90"></div>
                </div>

                <div className="relative h-full flex flex-col justify-end p-6 z-10 text-white">

                    {/* Number - Center Left */}
                    <div className="mb-7 pl-1">
                        <p className="font-sans text-[22px] tracking-[0.12em] font-medium drop-shadow-lg shadow-black/50">
                            {cardNumber}
                        </p>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between">
                        <div className="flex gap-14 pl-1">
                            {/* Expiration */}
                            <div>
                                <p className="text-[10px] opacity-100 font-medium mb-1 tracking-wide uppercase drop-shadow-md">Expiration date</p>
                                <p className="text-[14px] font-bold tracking-wider font-mono drop-shadow-md">{expiryDate}</p>
                            </div>
                            {/* CVV */}
                            <div>
                                <p className="text-[10px] opacity-100 font-medium mb-1 tracking-wide uppercase drop-shadow-md">CVV</p>
                                <p className="text-[14px] font-bold tracking-wider font-mono drop-shadow-md">***</p>
                            </div>
                        </div>

                        {/* Mastercard Logo - Classic Red/Orange Circles */}
                        <div className="flex flex-col items-end pb-1 pr-1">
                            <div className="relative h-10 w-16">
                                <div className="absolute right-4 top-0 bottom-0 w-8 h-8 bg-[#EB001B] rounded-full mix-blend-normal z-0 shadow-lg"></div>
                                <div className="absolute right-0 top-0 bottom-0 w-8 h-8 bg-[#F79E1B] rounded-full mix-blend-normal z-10 opacity-90 shadow-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Render Galicia Cards (Specific Designs)
    const isGalicia = institutionName.toLowerCase().includes('galicia');

    if (isGalicia && showCardDesign) {
        // Galicia Gold (Credit Cards: Visa & Amex)
        if (isCredit) {
            return (
                <div
                    onClick={onClick}
                    className={`
                        relative overflow-hidden rounded-2xl cursor-pointer
                        transition-all duration-200 ease-in-out
                        hover:scale-[1.02] transform
                        ${isSelected ? 'ring-2 ring-yellow-600 shadow-2xl scale-[1.02]' : 'shadow-lg hover:shadow-2xl'}
                    `}
                    style={{
                        aspectRatio: '1.586',
                        backgroundColor: '#C8A04D', // Galicia Gold color
                    }}
                >
                    {/* Noise Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-multiply"></div>

                    <div className="relative h-full flex flex-col justify-between p-6 text-slate-900 z-10">
                        <div className="flex justify-between items-start">
                            {/* Logo: Black text for Galicia Gold */}
                            {product.provider === 'AMEX' ? (
                                <div className="bg-black text-white px-2 py-1 font-bold tracking-tighter text-sm flex flex-col leading-none items-center justify-center h-10 w-10">
                                    <span>AM</span>
                                    <span>EX</span>
                                </div>
                            ) : (
                                <h3 className="font-bold italic text-2xl tracking-tight text-slate-900">
                                    VISA
                                    <span className="block text-[10px] font-normal not-italic -mt-1 text-slate-700">Crédito</span>
                                </h3>
                            )}

                            <div className="flex items-center gap-1 opacity-80">
                                <span className="text-sm font-medium">Mostrar datos</span>
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="font-mono text-xl md:text-2xl tracking-[0.1em] text-slate-900 font-medium">
                                {cardNumber}
                            </p>

                            <div className="flex justify-between items-end text-xs md:text-sm font-medium text-slate-800">
                                <div className="flex gap-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] mb-0.5 opacity-80">Fecha de vencimiento</span>
                                        <span>{expiryDate}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] mb-0.5 opacity-80">Código de seguridad</span>
                                        <span>***</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Galicia Debit (Dark Orange Gradient)
        // Reference: Dark Navy/Black on left fading to Burnt Orange on right
        if (isDebit) {
            return (
                <div
                    onClick={onClick}
                    className={`
                        relative overflow-hidden rounded-2xl cursor-pointer
                        transition-all duration-200 ease-in-out
                        hover:scale-[1.02] transform
                        ${isSelected ? 'ring-2 ring-orange-500 shadow-xl scale-[1.02]' : 'shadow-lg hover:shadow-xl'}
                    `}
                    style={{
                        aspectRatio: '1.586',
                        background: 'linear-gradient(90deg, #020C1E 0%, #5E2108 50%, #B83A06 100%)'
                    }}
                >
                    <div className="relative h-full flex flex-col justify-between p-6 text-white z-10">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold italic text-2xl tracking-tight text-white">
                                VISA
                                <span className="block text-[10px] font-normal not-italic -mt-1 text-gray-300">Débito</span>
                            </h3>

                            <div className="flex items-center gap-1 opacity-90">
                                <span className="text-sm font-medium">Mostrar datos</span>
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="font-mono text-xl md:text-2xl tracking-[0.1em] text-white font-medium drop-shadow-md">
                                {cardNumber}
                            </p>

                            <div className="flex justify-between items-end text-xs md:text-sm font-medium text-gray-200">
                                <div className="flex gap-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] mb-0.5 opacity-80">Fecha de vencimiento</span>
                                        <span>{expiryDate}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] mb-0.5 opacity-80">Código de seguridad</span>
                                        <span>***</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // 4. Render Standard Credit/Debit Card (Skeuomorphic)
    // For all non-AstroPay and non-Galicia cards
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl cursor-pointer
                transition-all duration-200 ease-in-out
                hover:scale-[1.02] transform
                ${isSelected ? 'ring-2 ring-primary shadow-2xl scale-[1.02]' : 'shadow-lg hover:shadow-2xl'}
            `}
            style={{ aspectRatio: '1.586' }}
        >
            {/* Fondo con gradiente */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors}`} />

            {/* Textura de ruido sutil */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>

            {/* Contenido de la tarjeta */}
            <div className="relative h-full flex flex-col justify-between p-6 text-white z-10">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg tracking-wide text-white/90 drop-shadow-sm">
                        {institutionName}
                    </h3>
                    {product.provider && CARD_PROVIDER_LOGOS[product.provider] ? (
                        <div className="h-8 opacity-90 brightness-200 grayscale-[0.2]">
                            <img
                                src={CARD_PROVIDER_LOGOS[product.provider]}
                                alt={product.provider}
                                className="h-full w-auto object-contain"
                            />
                        </div>
                    ) : (
                        <span className="material-symbols-outlined text-white/50 text-3xl">contactless</span>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-yellow-200/20 rounded flex items-center justify-center border border-yellow-200/30 backdrop-blur-sm">
                            <div className="w-6 h-4 border border-yellow-500/50 rounded-[2px]" />
                        </div>
                        <span className="material-symbols-outlined text-white/70">wifi</span>
                    </div>

                    <p className="font-mono text-xl md:text-2xl tracking-[0.14em] text-white/95 shadow-black/10 drop-shadow-md">
                        {cardNumber}
                    </p>

                    <div className="flex justify-between items-end text-xs md:text-sm font-medium text-white/80">
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] uppercase opacity-70 mb-0.5">Expires</span>
                                <span className="font-mono">{expiryDate}</span>
                            </div>
                        </div>
                        <span className="uppercase tracking-widest text-[10px] font-bold opacity-90 border border-white/20 px-2 py-0.5 rounded">
                            {isCredit ? 'Credit' : 'Debit'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
