import { Suspense } from 'react';
import ServicesClient from '@/src/components/services/ServicesClient';

export default function ServicesPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<div>Cargando...</div>}>
                <ServicesClient />
            </Suspense>
        </div>
    );
}
