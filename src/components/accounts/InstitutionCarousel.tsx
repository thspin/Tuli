'use client'

import { useState } from 'react';
import { InstitutionWithProducts } from '@/src/types';
import EditInstitutionModal from './EditInstitutionModal';

interface InstitutionCarouselProps {
    institutions: InstitutionWithProducts[];
    selectedInstitutionId: string | null;
    onSelectInstitution: (id: string) => void;
}

export default function InstitutionCarousel({
    institutions,
    selectedInstitutionId,
    onSelectInstitution
}: InstitutionCarouselProps) {
    const [editingInstitution, setEditingInstitution] = useState<InstitutionWithProducts | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (institutions.length === 0) {
        return null;
    }

    const handleEditClick = (e: React.MouseEvent, institution: InstitutionWithProducts) => {
        e.stopPropagation();
        setEditingInstitution(institution);
        setIsEditModalOpen(true);
    };

    return (
        <>
            <div className="py-6 mb-8">
                {/* Grid de todas las instituciones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {institutions.map((institution) => {
                        const isSelected = institution.id === selectedInstitutionId;

                        return (
                            <div
                                key={institution.id}
                                onClick={() => onSelectInstitution(institution.id)}
                                className={`
                                    relative flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl
                                    transition-all duration-300 ease-out cursor-pointer
                                    hover:scale-105 hover:shadow-lg group
                                    ${isSelected
                                        ? 'bg-primary/10 border-2 border-primary shadow-lg scale-105'
                                        : 'bg-card border border-border hover:border-primary/50'
                                    }
                                `}
                            >
                                {/* Botón de editar */}
                                <button
                                    onClick={(e) => handleEditClick(e, institution)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                                    title="Editar institución"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>

                                {/* Logo de la institución */}
                                <div className={`
                                    flex items-center justify-center rounded-full
                                    transition-all duration-300
                                    ${isSelected
                                        ? 'w-14 h-14 md:w-16 md:h-16 text-4xl md:text-5xl'
                                        : 'w-12 h-12 md:w-14 md:h-14 text-3xl md:text-4xl'
                                    }
                                    bg-gradient-to-br from-primary/5 to-primary/10
                                `}>
                                    <span>{institution.type === 'BANK' ? '🏦' : '📱'}</span>
                                </div>

                                {/* Nombre de la institución */}
                                <div className="text-center w-full">
                                    <h3 className={`
                                        font-semibold text-foreground transition-all duration-300 truncate
                                        ${isSelected ? 'text-base md:text-lg' : 'text-sm md:text-base'}
                                    `}>
                                        {institution.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">
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

