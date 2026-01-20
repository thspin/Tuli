import { Suspense } from 'react';
import ServicesClient from '@/src/components/services/ServicesClient';

// Force dynamic rendering - Clerk requires publishableKey at build time
export const dynamic = 'force-dynamic';

export default function ServicesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ServicesClient />
        </Suspense>
    );
}
