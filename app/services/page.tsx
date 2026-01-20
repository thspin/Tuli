import { Suspense } from 'react';
import ServicesClient from '@/src/components/services/ServicesClient';

export default function ServicesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ServicesClient />
        </Suspense>
    );
}
