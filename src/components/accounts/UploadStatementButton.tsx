'use client';

import { useState } from 'react';
import UploadStatementModal from './UploadStatementModal';
import type { InstitutionWithProducts } from '@/src/types';

interface UploadStatementButtonProps {
    institution: InstitutionWithProducts;
}

export default function UploadStatementButton({ institution }: UploadStatementButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Check if institution has credit cards
    const creditCards = institution.products.filter(p => p.type === 'CREDIT_CARD');

    if (creditCards.length === 0) {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                title="Subir resumen PDF"
            >
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                <span className="hidden sm:inline">Subir Resumen</span>
            </button>

            {isModalOpen && (
                <UploadStatementModal
                    institution={institution}
                    creditCards={creditCards}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}
