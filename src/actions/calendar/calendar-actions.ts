'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";

export type CalendarEventType = 'BILL' | 'CARD_CLOSING' | 'CARD_DUE' | 'CARD_EXPIRATION' | 'NOTE_DEADLINE' | 'SERVICE_PROMO_END';

export interface CalendarEvent {
    id: string;
    date: string; // ISO string
    type: CalendarEventType;
    title: string;
    amount?: number;
    status?: string;
    color?: string;
    metadata?: Record<string, unknown>;
}

// Helper function to get a short display name for a card (e.g., "Visa Galicia" or "MC Nacion")
function getCardDisplayName(productName: string, institutionName?: string | null): string {
    const name = productName.toLowerCase();
    let cardBrand = '';

    if (name.includes('visa')) {
        cardBrand = 'Visa';
    } else if (name.includes('mastercard') || name.includes('master')) {
        cardBrand = 'Master';
    } else if (name.includes('amex') || name.includes('american')) {
        cardBrand = 'Amex';
    } else if (name.includes('naranja')) {
        cardBrand = 'Naranja';
    } else if (name.includes('cabal')) {
        cardBrand = 'Cabal';
    }

    const institutionShort = institutionName?.replace('Banco ', '') || '';

    if (cardBrand && institutionShort) {
        return `${cardBrand} ${institutionShort}`;
    } else if (cardBrand) {
        return cardBrand;
    } else if (institutionShort) {
        return institutionShort;
    }
    return productName;
}

export async function getCalendarEvents(month: number, year: number) {
    try {
        const user = await requireUser();

        // Define date range for the month
        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // End of last day of month

        console.log(`[Calendar] Fetching events for ${month}/${year}`);
        console.log(`[Calendar] User: ${user.id}`);

        const events: CalendarEvent[] = [];

        // 1. Fetch Service Bills
        const bills = await prisma.serviceBill.findMany({
            where: {
                userId: user.id,
                dueDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                service: {
                    include: { category: true }
                }
            }
        });

        console.log(`[Calendar] Found ${bills.length} bills`);

        bills.forEach(bill => {
            events.push({
                id: `bill-${bill.id}`,
                date: bill.dueDate.toISOString(),
                type: 'BILL',
                title: bill.service.name,
                amount: Number(bill.amount),
                status: bill.status,
                color: '#3B82F6',
                metadata: {
                    billId: bill.id,
                    serviceId: bill.serviceId,
                    categoryIcon: bill.service.category?.icon
                }
            });
        });

        console.log(`[Calendar] Fetching summaries from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const summaries = await prisma.creditCardSummary.findMany({
            where: {
                userId: user.id,
                OR: [
                    {
                        closingDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    {
                        dueDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                ]
            },
            include: {
                product: {
                    include: { institution: true }
                }
            }
        });

        console.log(`[Calendar] Found ${summaries.length} summaries`);
        summaries.forEach(s => console.log(`[Calendar] Summary found: Product=${s.product.name} Closing=${s.closingDate.toISOString()} Due=${s.dueDate.toISOString()}`));

        const summarizedProductIds = new Set(summaries.map(s => s.productId));

        summaries.forEach(summary => {
            const displayName = getCardDisplayName(
                summary.product.name || '',
                summary.product.institution?.name
            );

            // Only add closing event if it falls in the current month
            if (summary.closingDate >= startDate && summary.closingDate <= endDate) {
                events.push({
                    id: `closing-summary-${summary.id}`,
                    date: summary.closingDate.toISOString(),
                    type: 'CARD_CLOSING',
                    title: `Cierre ${displayName}`,
                    amount: Number(summary.totalAmount),
                    status: summary.status,
                    color: '#F59E0B',
                    metadata: {
                        productId: summary.productId,
                        summaryId: summary.id,
                        productType: summary.product.type,
                        institutionName: summary.product.institution?.name || 'Desconocido'
                    }
                });
            }

            // Only add due event if it falls in the current month
            if (summary.dueDate >= startDate && summary.dueDate <= endDate) {
                events.push({
                    id: `due-summary-${summary.id}`,
                    date: summary.dueDate.toISOString(),
                    type: 'CARD_DUE',
                    title: `Venc. ${displayName}`,
                    amount: Number(summary.totalAmount),
                    status: summary.status,
                    color: '#EF4444',
                    metadata: {
                        productId: summary.productId,
                        summaryId: summary.id,
                        productType: summary.product.type,
                        institutionName: summary.product.institution?.name || 'Desconocido'
                    }
                });
            }
        });

        // 3. Fetch PRODUCTS WITHOUT summaries for this month to show ESTIMATED dates
        const products = await prisma.financialProduct.findMany({
            where: {
                userId: user.id,
                id: { notIn: Array.from(summarizedProductIds) },
                OR: [
                    { closingDay: { not: null } },
                    { dueDay: { not: null } }
                ]
            },
            include: {
                institution: true
            }
        });

        console.log(`[Calendar] Found ${products.length} products without summaries for this period`);

        const lastDayOfMonth = endDate.getDate();

        // 4. ADD Card Expiration Events
        const expiringCards = await prisma.financialProduct.findMany({
            where: {
                userId: user.id,
                expirationDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: { institution: true }
        });

        expiringCards.forEach(card => {
            if (card.expirationDate) {
                events.push({
                    id: `exp-${card.id}`,
                    date: card.expirationDate.toISOString(),
                    type: 'CARD_EXPIRATION',
                    title: `Vence Plástico ${card.lastFourDigits || ''}`,
                    status: 'UPCOMING',
                    color: '#6366F1', // Indigo/Blue for expiration
                    metadata: {
                        productId: card.id,
                        institutionName: card.institution?.name || 'Desconocido'
                    }
                });
            }
        });

        products.forEach(product => {
            const estDisplayName = getCardDisplayName(product.name, product.institution?.name);

            // Estimated Closing Day
            if (product.closingDay) {
                const actualDay = Math.min(product.closingDay, lastDayOfMonth);
                // Set to noon to avoid timezone shifts showing it on previous day
                const closingDate = new Date(year, month - 1, actualDay, 12, 0, 0);

                events.push({
                    id: `closing-est-${product.id}-${month}-${year}`,
                    date: closingDate.toISOString(),
                    type: 'CARD_CLOSING',
                    title: `Cierre ${estDisplayName} (Est.)`,
                    status: 'UPCOMING',
                    color: '#F59E0B',
                    metadata: {
                        productId: product.id,
                        productType: product.type,
                        institutionName: product.institution?.name || 'Desconocido',
                        month,
                        year
                    }
                });
            }

            // Estimated Due Day
            if (product.dueDay) {
                const actualDay = Math.min(product.dueDay, lastDayOfMonth);
                // Set to noon to avoid timezone shifts showing it on previous day
                const dueDate = new Date(year, month - 1, actualDay, 12, 0, 0);

                events.push({
                    id: `due-est-${product.id}-${month}-${year}`,
                    date: dueDate.toISOString(),
                    type: 'CARD_DUE',
                    title: `Venc. ${estDisplayName} (Est.)`,
                    status: 'UPCOMING',
                    color: '#EF4444',
                    metadata: {
                        productId: product.id,
                        productType: product.type,
                        institutionName: product.institution?.name || 'Desconocido',
                        month,
                        year
                    }
                });
            }
        });

        // 5. Fetch Notes with Deadlines
        const notes = await prisma.note.findMany({
            where: {
                userId: user.id,
                deadline: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // 6. Fetch Service Promo Ends
        const services = await prisma.service.findMany({
            where: {
                userId: user.id,
                active: true,
                renewalDate: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        services.forEach(service => {
            if (service.renewalDate) {
                events.push({
                    id: `promo-end-${service.id}`,
                    date: service.renewalDate.toISOString(),
                    type: 'SERVICE_PROMO_END',
                    title: `Fin Promo: ${service.name}`,
                    status: 'UPCOMING',
                    color: '#EC4899', // Pinkish
                    metadata: {
                        serviceId: service.id,
                        renewalNote: service.renewalNote
                    }
                });
            }
        });

        notes.forEach(note => {
            if (note.deadline) {
                events.push({
                    id: `note-${note.id}`,
                    date: note.deadline.toISOString(),
                    type: 'NOTE_DEADLINE',
                    title: note.title,
                    status: note.isCompleted ? 'COMPLETED' : 'PENDING',
                    color: note.color === 'yellow' ? '#FBBF24' : note.color === 'blue' ? '#60A5FA' : note.color === 'red' ? '#F87171' : note.color === 'green' ? '#34D399' : '#A78BFA',
                    metadata: {
                        noteId: note.id,
                        content: note.content
                    }
                });
            }
        });

        console.log(`[Calendar] Total events: ${events.length}`);

        // --- DEDUPLICATION LOGIC FOR NARANJA X ---
        // Naranja X is a special case where multiple cards (Visa, Master, NX) share the same statement and dates.
        // We want to show only ONE event per date/type for Naranja to avoid clutter.
        // Also, dates might differ slightly if estimates are off (e.g. 14th vs 15th), so we group by MONTH.

        const otherEvents = events.filter(e => {
            const inst = (e.metadata?.institutionName as string || '').toLowerCase();
            return !inst.includes('naranja');
        });

        const naranjaEvents = events.filter(e => {
            const inst = (e.metadata?.institutionName as string || '').toLowerCase();
            return inst.includes('naranja');
        });

        const mergedNaranjaEvents: CalendarEvent[] = [];
        const naranjaGroups = new Map<string, CalendarEvent[]>();

        // Group by Month + Type (e.g. "2026-01|CARD_CLOSING")
        // This ensures that if we have an Estimate for Jan 15 and a Real for Jan 27, they end up in the same group
        naranjaEvents.forEach(e => {
            const dateObj = new Date(e.date);
            const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}|${e.type}`;
            if (!naranjaGroups.has(key)) naranjaGroups.set(key, []);
            naranjaGroups.get(key)!.push(e);
        });

        naranjaGroups.forEach((groupEvents) => {
            // Priority: Real Summary Events > Estimated Events
            const realEvents = groupEvents.filter(e => e.id.startsWith('closing-summary') || e.id.startsWith('due-summary'));
            const estEvents = groupEvents.filter(e => e.id.startsWith('closing-est') || e.id.startsWith('due-est'));

            // If we have ANY real event for this month, we discard ALL estimated events
            const targetEvents = realEvents.length > 0 ? realEvents : estEvents;

            if (targetEvents.length === 0) return;

            // Sort by date (descending) to pick the latest date if conflicts exist
            targetEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Deduplicate exact same events (same ID) just in case
            const uniqueEvents = Array.from(new Map(targetEvents.map(item => [item.id, item])).values());

            // Calculate total amount from UNIQUE Real events
            const totalAmount = uniqueEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

            // Pick the "active" event to display
            const displayEvent = uniqueEvents[0];

            // Create a generic title
            let newTitle = displayEvent.title;
            const isEst = targetEvents === estEvents;

            // Simplified titles for the unified view
            if (displayEvent.type === 'CARD_CLOSING') {
                newTitle = isEst ? 'Cierre Naranja X (Est.)' : 'Cierre Naranja X';
            } else if (displayEvent.type === 'CARD_DUE') {
                newTitle = isEst ? 'Vencimiento Naranja X (Est.)' : 'Vence Naranja X';
            }

            if (displayEvent.type === 'CARD_EXPIRATION') {
                // For expiration, keep them separate
                uniqueEvents.forEach(e => mergedNaranjaEvents.push(e));
            } else {
                mergedNaranjaEvents.push({
                    ...displayEvent,
                    title: newTitle,
                    amount: totalAmount,
                });
            }
        });

        return { success: true, events: [...otherEvents, ...mergedNaranjaEvents] };

    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return { success: false, error: 'Failed to fetch calendar events', events: [] };
    }
}
