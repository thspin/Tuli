'use client'

import { useState } from 'react';
import { InstitutionWithProducts } from '@/src/types';
import EditInstitutionModal from './EditInstitutionModal';

interface InstitutionCarouselProps {
    institutions: InstitutionWithProducts[];
    selectedInstitutionId: string | null;
    onSelectInstitution: (id: string) => void;
}

// Mapeo de logos de instituciones argentinas conocidas
const INSTITUTION_LOGOS: Record<string, string> = {
    'BBVA': 'https://logo.clearbit.com/bbva.com',
    'Banco BBVA': 'https://logo.clearbit.com/bbva.com',
    'Galicia': 'https://logo.clearbit.com/bancogalicia.com',
    'Banco Galicia': 'https://logo.clearbit.com/bancogalicia.com',
    'Santander': 'https://logo.clearbit.com/santander.com.ar',
    'Banco Santander': 'https://logo.clearbit.com/santander.com.ar',
    'Nación': 'https://logo.clearbit.com/bna.com.ar',
    'Banco Nación': 'https://logo.clearbit.com/bna.com.ar',
    'Macro': 'https://logo.clearbit.com/macro.com.ar',
    'Banco Macro': 'https://logo.clearbit.com/macro.com.ar',
    'ICBC': 'https://logo.clearbit.com/icbc.com.ar',
    'Banco ICBC': 'https://logo.clearbit.com/icbc.com.ar',
    'Supervielle': 'https://logo.clearbit.com/supervielle.com.ar',
    'Banco Supervielle': 'https://logo.clearbit.com/supervielle.com.ar',
    'Ciudad': 'https://logo.clearbit.com/bancociudad.com.ar',
    'Banco Ciudad': 'https://logo.clearbit.com/bancociudad.com.ar',
    'Provincia': 'https://logo.clearbit.com/bancoprovincia.com.ar',
    'Banco Provincia': 'https://logo.clearbit.com/bancoprovincia.com.ar',
    'Patagonia': 'https://logo.clearbit.com/bancopatagonia.com.ar',
    'Banco Patagonia': 'https://logo.clearbit.com/bancopatagonia.com.ar',
    'Hipotecario': 'https://logo.clearbit.com/hipotecario.com.ar',
    'Banco Hipotecario': 'https://logo.clearbit.com/hipotecario.com.ar',
    'Comafi': 'https://logo.clearbit.com/comafi.com.ar',
    'Banco Comafi': 'https://logo.clearbit.com/comafi.com.ar',
    'Credicoop': 'https://logo.clearbit.com/bancocredicoop.coop',
    'Banco Credicoop': 'https://logo.clearbit.com/bancocredicoop.coop',
    'HSBC': 'https://logo.clearbit.com/hsbc.com.ar',
    'Banco HSBC': 'https://logo.clearbit.com/hsbc.com.ar',
    'Itaú': 'https://logo.clearbit.com/itau.com.ar',
    'Banco Itaú': 'https://logo.clearbit.com/itau.com.ar',
    'Brubank': 'https://logo.clearbit.com/brubank.com',
    'Naranja X': 'https://logo.clearbit.com/naranjax.com',
    'Mercado Pago': 'https://logo.clearbit.com/mercadopago.com.ar',
    'Ualá': 'https://logo.clearbit.com/uala.com.ar',
    'Personal Pay': 'https://logo.clearbit.com/personal.com.ar',
    'Claro Pay': 'https://logo.clearbit.com/claro.com.ar',
    'Prex': 'https://logo.clearbit.com/prex.com.ar',
    'Lemon': 'https://logo.clearbit.com/lemon.me',
    'Belo': 'https://logo.clearbit.com/belo.app',
    'Wilobank': 'https://logo.clearbit.com/wilobank.com',
    'Reba': 'https://logo.clearbit.com/reba.ar',
    'Tarjeta Naranja': 'https://logo.clearbit.com/tarjetanaranja.com.ar',
    'AstroPay': 'https://logo.clearbit.com/astropay.com',
    'Rioja': 'https://logo.clearbit.com/bancorioja.com.ar',
    'Banco Rioja': 'https://logo.clearbit.com/bancorioja.com.ar',
    'Takenos': 'https://logo.clearbit.com/takenos.com',
};

function getInstitutionLogo(name: string): string | null {
    // Buscar coincidencia exacta
    if (INSTITUTION_LOGOS[name]) {
        return INSTITUTION_LOGOS[name];
    }

    // Buscar coincidencia parcial (case insensitive)
    const normalizedName = name.toLowerCase();
    for (const [key, value] of Object.entries(INSTITUTION_LOGOS)) {
        if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
            return value;
        }
    }

    return null;
}

export default function InstitutionCarousel({
    institutions,
    selectedInstitutionId,
    onSelectInstitution
}: InstitutionCarouselProps) {
    const [editingInstitution, setEditingInstitution] = useState<InstitutionWithProducts | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

    if (institutions.length === 0) {
        return null;
    }

    const handleEditClick = (e: React.MouseEvent, institution: InstitutionWithProducts) => {
        e.stopPropagation();
        setEditingInstitution(institution);
        setIsEditModalOpen(true);
    };

    const handleLogoError = (institutionId: string) => {
        setFailedLogos(prev => new Set(prev).add(institutionId));
    };

    return (
        <>
            <div className="py-4 mb-6">
                {/* Grid de instituciones - más compacto */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                    {institutions.map((institution) => {
                        const isSelected = institution.id === selectedInstitutionId;
                        const logoUrl = getInstitutionLogo(institution.name);
                        const showLogo = logoUrl && !failedLogos.has(institution.id);

                        return (
                            <div
                                key={institution.id}
                                onClick={() => onSelectInstitution(institution.id)}
                                className={`
                                    relative flex flex-col items-center gap-2 p-3 rounded-lg
                                    transition-all duration-200 ease-out cursor-pointer
                                    hover:scale-[1.02] group
                                    ${isSelected
                                        ? 'bg-primary/10 border-2 border-primary shadow-md ring-2 ring-primary/20'
                                        : 'bg-card border border-border hover:border-primary/40 hover:shadow-sm'
                                    }
                                `}
                            >
                                {/* Botón de editar - más pequeño */}
                                <button
                                    onClick={(e) => handleEditClick(e, institution)}
                                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all z-10"
                                    title="Editar institución"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>

                                {/* Logo de la institución */}
                                <div className={`
                                    flex items-center justify-center rounded-lg overflow-hidden
                                    transition-all duration-200
                                    ${isSelected ? 'w-12 h-12' : 'w-10 h-10'}
                                    ${showLogo ? 'bg-white p-1.5' : 'bg-gradient-to-br from-primary/5 to-primary/10'}
                                `}>
                                    {showLogo ? (
                                        <img
                                            src={logoUrl}
                                            alt={institution.name}
                                            className="w-full h-full object-contain"
                                            onError={() => handleLogoError(institution.id)}
                                        />
                                    ) : (
                                        <span className={`${isSelected ? 'text-2xl' : 'text-xl'}`}>
                                            {institution.type === 'BANK' ? '🏦' : '📱'}
                                        </span>
                                    )}
                                </div>

                                {/* Nombre de la institución */}
                                <div className="text-center w-full">
                                    <h3 className={`
                                        font-semibold text-foreground transition-all duration-200 truncate px-1
                                        ${isSelected ? 'text-sm' : 'text-xs'}
                                    `}>
                                        {institution.name}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {institution.products.length} {institution.products.length === 1 ? 'producto' : 'productos'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Institution Modal */}
            {editingInstitution && (
                <EditInstitutionModal
                    institution={editingInstitution}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingInstitution(null);
                    }}
                />
            )}
        </>
    );
}
