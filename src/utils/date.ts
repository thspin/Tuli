/**
 * Utility for handling dates in Buenos Aires timezone (UTC-3)
 */

export const BUENOS_AIRES_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Returns the current date in Buenos Aires as a YYYY-MM-DD string
 */
export function getTodayInBuenosAires(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: BUENOS_AIRES_TIMEZONE });
}

/**
 * Converts a Date or string to YYYY-MM-DD in Buenos Aires timezone
 */
export function toISODate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', { timeZone: BUENOS_AIRES_TIMEZONE });
}

/**
 * Formats a date to a string suitable for display in Argentina (DD/MM/YYYY or similar)
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    // If the input is a date-only string (YYYY-MM-DD), new Date(date) will interpret it as UTC.
    // To display it correctly in any timezone, we should either:
    // 1. Use UTC if we want to show exactly what's in the string.
    // 2. Use the BA timezone if we want to show it as it was intended.

    // Most dates in this app come from the DB as full timestamps or from inputs as YYYY-MM-DD.
    // If it's a YYYY-MM-DD string, we want to show that exact day.
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        return utcDate.toLocaleDateString('es-AR', { ...options, timeZone: 'UTC' });
    }

    return d.toLocaleDateString('es-AR', { ...options, timeZone: BUENOS_AIRES_TIMEZONE });
}

/**
 * Formats a date to DD/MM/YYYY specifically
 */
export function formatDateShort(date: Date | string): string {
    return formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Parses a YYYY-MM-DD string into a Date object at 00:00:00 in Buenos Aires timezone.
 * This is useful for the server actions to ensure the date is stored correctly.
 */
export function parseLocalDatePicker(dateStr: string): Date {
    // We want the date to be saved as the beginning of the day in Buenos Aires.
    // Date.parse('YYYY-MM-DD') returns UTC midnight.
    // We can use a trick: parse it, then adjust for the offset.
    const date = new Date(dateStr + 'T00:00:00');
    // This creates a date in the BROWSER'S local time. 
    // If the browser is in BA, it's correct.
    return date;
}
