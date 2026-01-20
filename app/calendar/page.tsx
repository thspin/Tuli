import CalendarClient from '@/src/components/calendar/CalendarClient';

// Force dynamic rendering - Clerk requires publishableKey at build time
export const dynamic = 'force-dynamic';

export default function CalendarPage() {
    return <CalendarClient />;
}
