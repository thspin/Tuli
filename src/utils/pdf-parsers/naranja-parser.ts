/**
 * Naranja X PDF Parser
 * Handles Naranja X consolidated statements (NX Virtual, Naranja X, NX Visa)
 */

import type {
    ParsedStatement,
    ParsedTransaction,
    ParsedAdjustment,
} from '@/src/types';
import {
    parseArgentineNumber,
    parseDate,
} from '../pdf-parser';

/**
 * Parse a Naranja X credit card statement
 * Note: Naranja X consolidates all cards in one statement but we need to
 * track which transactions belong to which card
 */
export function parseNaranjaStatement(text: string): ParsedStatement {
    const fullText = text;

    // Extract closing date: "El resumen actual cerró el 27/12"
    // Extract closing date: "El resumen actual cerró el 27/12"
    let closingDate = new Date();

    // Try multiple patterns for closing date
    const closingPatterns = [
        /resumen\s+actual\s+cerr[oó]\s+el\s+(\d{1,2}\/\d{1,2})/i,
        /cierre\s+actual[:\s]+(\d{1,2}\/\d{1,2})/i,
        /fecha\s+de\s+cierre[:\s]+(\d{1,2}\/\d{1,2})/i
    ];

    let closingMatch = null;
    for (const pattern of closingPatterns) {
        closingMatch = fullText.match(pattern);
        if (closingMatch) break;
    }

    if (closingMatch) {
        // Get year from context (vence date has full year)
        const yearMatch = fullText.match(/vence\s+el\s+\d{1,2}\/\d{1,2}\/(\d{2,4})/i) ||
            fullText.match(/\/\d{1,2}\/(\d{2,4})/); // Fallback: find any year in text

        const currentYear = new Date().getFullYear();
        const year = yearMatch ? (parseInt(yearMatch[1]) < 100 ? 2000 + parseInt(yearMatch[1]) : parseInt(yearMatch[1])) : currentYear;

        const [day, month] = closingMatch[1].split('/').map(Number);
        // Set time to noon (12:00) to avoid timezone issues when converting to UTC
        closingDate = new Date(year, month - 1, day, 12, 0, 0);

        // If closing is in a later month than due date, it's previous year (Dec closing, Jan due)
        // OR if closing is in the future relative to now + buffer, maybe it's previous year (unlikely for "current" closing)
        const dueMonthMatch = fullText.match(/vence\s+el\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
        if (dueMonthMatch) {
            const dueMonth = parseInt(dueMonthMatch[2]);
            const dueYear = parseInt(dueMonthMatch[3]) < 100 ? 2000 + parseInt(dueMonthMatch[3]) : parseInt(dueMonthMatch[3]);

            if (month > dueMonth && year === dueYear) {
                // Set time to noon (12:00) to avoid timezone issues when converting to UTC
                closingDate = new Date(year - 1, month - 1, day, 12, 0, 0);
            }
        }
    }

    // Extract due date: "vence el 10/01/26"
    let dueDate = new Date();
    const duePatterns = [
        /vence\s+el\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /vencimiento[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /fecha\s+de\s+vencimiento[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i
    ];

    for (const pattern of duePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            const parsed = parseDate(match[1]);
            if (parsed) {
                dueDate = parsed;
                break;
            }
        }
    }

    // Extract previous closing date: "Tu resumen anterior cerró el 27/11"
    let previousClosingDate: Date | undefined;
    const prevClosingMatch = fullText.match(/resumen\s+anterior\s+cerr[oó]\s+el\s+(\d{1,2}\/\d{1,2})/i);
    if (prevClosingMatch) {
        const [day, month] = prevClosingMatch[1].split('/').map(Number);
        const year = closingDate.getFullYear();
        // Set time to noon (12:00) to avoid timezone issues when converting to UTC
        previousClosingDate = new Date(month > closingDate.getMonth() + 1 ? year - 1 : year, month - 1, day, 12, 0, 0);
    }

    // Extract previous due date: "venció el 10/12"
    let previousDueDate: Date | undefined;
    const prevDueMatch = fullText.match(/venci[oó]\s+el\s+(\d{1,2}\/\d{1,2})/i);
    if (prevDueMatch) {
        const [day, month] = prevDueMatch[1].split('/').map(Number);
        const year = closingDate.getFullYear();
        // Set time to noon (12:00) to avoid timezone issues when converting to UTC
        previousDueDate = new Date(year, month - 1, day, 12, 0, 0);
    }

    // Extract total amount: "Tu total a pagar es $1.526.731,71 + u$s39,91"
    let totalAmount = 0;
    let totalAmountUSD = 0;
    const totalMatch = fullText.match(/total\s+a\s+pagar\s+es\s+\$([\d.,]+)(?:\s*\+\s*u\$s([\d.,]+))?/i);
    if (totalMatch) {
        totalAmount = parseArgentineNumber(totalMatch[1]);
        if (totalMatch[2]) {
            totalAmountUSD = parseArgentineNumber(totalMatch[2]);
        }
    }

    // Alternative pattern: "TOTAL $1.526.731,71 +u$s39,91"
    const altTotalMatch = fullText.match(/TOTAL\s+\$([\d.,]+)\s*\+?u?\$?s?([\d.,]+)?/i);
    if (!totalAmount && altTotalMatch) {
        totalAmount = parseArgentineNumber(altTotalMatch[1]);
        if (altTotalMatch[2]) {
            totalAmountUSD = parseArgentineNumber(altTotalMatch[2]);
        }
    }

    // Extract payment made: "PAGO EN PESOS 1.466.155,36"
    let paymentMade = 0;
    let paymentMadeUSD = 0;
    const paymentMatch = fullText.match(/PAGO\s+EN\s+PESOS\s+([\d.,]+)/i);
    if (paymentMatch) {
        paymentMade = parseArgentineNumber(paymentMatch[1]);
    }
    const paymentUSDMatch = fullText.match(/PAGO\s+VENCIMIENTO\s+EN\s+DOLARES\s+([\d.,]+)/i);
    if (paymentUSDMatch) {
        paymentMadeUSD = parseArgentineNumber(paymentUSDMatch[1]);
    }

    // Parse transactions
    const transactions = parseNaranjaTransactions(fullText);

    // Parse adjustments
    const adjustments = parseNaranjaAdjustments(fullText);

    // Calculate card breakdown
    const cardBreakdown = calculateCardBreakdown(transactions);

    // Calculate statement month/year from closing date
    // Statement month is based on the closing month
    const statementMonth = closingDate.getMonth() + 1;
    const statementYear = closingDate.getFullYear();

    // Extract next closing/due dates: "El próximo resumen cierra el 27/01 y vence el 10/02"
    let nextClosingDate: Date | undefined;
    let nextDueDate: Date | undefined;

    const nextClosingPattern = /pr[oó]ximo\s+resumen\s+cierra\s+el\s+(\d{1,2}\/\d{1,2})/i;
    const nextClosingMatch = fullText.match(nextClosingPattern);

    if (nextClosingMatch) {
        const [day, month] = nextClosingMatch[1].split('/').map(Number);
        const year = closingDate.getFullYear() + (month < closingDate.getMonth() + 1 ? 1 : 0);
        nextClosingDate = new Date(year, month - 1, day, 12, 0, 0);
    }

    const nextDuePattern = /pr[oó]ximo.*?vence\s+el\s+(\d{1,2}\/\d{1,2})/i;
    const nextDueMatch = fullText.match(nextDuePattern);

    if (nextDueMatch) {
        const [day, month] = nextDueMatch[1].split('/').map(Number);
        // If next due month is smaller than next closing month, it's the following year (should be handled by standard logic usually, but here explicit)
        // Usually due date is after closing.
        const year = (nextClosingDate ? nextClosingDate.getFullYear() : closingDate.getFullYear()) +
            (month < (nextClosingDate ? nextClosingDate.getMonth() + 1 : closingDate.getMonth() + 1) ? 1 : 0);
        nextDueDate = new Date(year, month - 1, day, 12, 0, 0);
    }

    return {
        institution: 'naranja',
        cardType: 'naranja',
        cardProvider: 'OTHER',
        closingDate,
        dueDate,
        statementMonth,
        statementYear,
        previousClosingDate,
        previousDueDate,
        nextClosingDate,
        nextDueDate,
        previousBalance: 0,
        paymentMade,
        paymentMadeUSD,
        totalAmount,
        totalAmountUSD,
        transactions,
        adjustments,
        cardBreakdown,
        rawText: text,
    };
}

/**
 * Parse transactions from Naranja X statement
 * Improved version with better handling of edge cases
 */
function parseNaranjaTransactions(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    // Split text into lines for better parsing
    const lines = text.split('\n');

    // Track if previous line was a credit note header
    let pendingCreditNote = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for credit note header
        if (line.match(/NOTA\s+DE\s+CREDITO/i)) {
            pendingCreditNote = true;
            continue;
        }

        // Payment pattern
        const paymentMatch = line.match(/^(\d{2}\/\d{2}\/\d{2})\s+PAGO\s+(?:EN\s+PESOS|VENCIMIENTO\s+EN\s+DOLARES)\s+([\d.,]+)/i);
        if (paymentMatch) {
            const date = parseDate(paymentMatch[1]);
            if (date) {
                transactions.push({
                    date,
                    description: 'Pago',
                    amount: parseArgentineNumber(paymentMatch[2]),
                    currency: 'ARS',
                    isPlanZ: false,
                    isPayment: true,
                    cardName: 'Pago',
                });
            }
            continue;
        }

        // Main transaction pattern - more flexible
        // Captures: date, card type, coupon, description (everything until installment/plan/amount)
        // For tax entries, we need to capture the LAST amount (after base/percentage info)
        // NOTE: "Zeta" is Astropay's debit card, NOT Plan Z. Plan Z is a financing plan.
        const txMatch = line.match(/^(\d{2}\/\d{2}\/\d{2})\s+(NX\s*Virtual|Naranja\s*X|NX\s*Visa|NX\s*Master(?:card)?)\s+(\d+)\s+(.+?)\s+(?:(PLAN\s*Z)|(?:Deb\.Aut\.)|(\d{2}\/\d{2})|(\d{2})|(?:Zeta))?\s+([-\d.,]+)$/i);

        if (txMatch) {
            const date = parseDate(txMatch[1]);
            if (!date) continue;

            const cardName = txMatch[2].replace(/\s+/g, ' ').trim();
            const couponNumber = txMatch[3];
            let description = txMatch[4].trim();
            // Only set isPlanZ to true if we explicitly matched "PLAN Z", not "Zeta"
            const isPlanZ = !!txMatch[5];
            const installmentStr = txMatch[6]; // NN/NN format
            const singleInstallment = txMatch[7]; // Just "01" or similar
            let amountStr = txMatch[8];

            // Handle tax entries specially - they may have base amounts in description
            // Example: "IVA RG 4240 21% SERV. DIGITAL" or "PERCEPCION RG 5617 ARCA (52.274,97)"
            const isTaxEntry = description.match(/IVA\s+RG|PERCEPCION\s+RG/i);
            if (isTaxEntry) {
                // For tax entries, the amount captured is the final tax amount
                // But we may have intermediate numbers in the description (base, percentage, rule number)
                // Remove numbers in parentheses (base amounts) from description
                description = description.replace(/\([^\)]+\)/g, '').trim();
                // The captured amountStr is already the correct final amount
                // Skip to avoid duplicate processing - these will be handled in parseNaranjaAdjustments
                continue;
            }

            // Skip other adjustment entries
            if (description.match(/Impuesto\s+de\s+Sellos/i)) {
                continue;
            }

            // Parse amount
            let amount = parseArgentineNumber(amountStr);

            // Handle credit notes from previous line
            if (pendingCreditNote) {
                amount = -Math.abs(amount);
                pendingCreditNote = false;
            }

            // Check for credit indicators in description
            const isCredit = description.match(/REVERSO|REVERTIDO|DEVOLUCION|CANCELACION/i);
            if (isCredit) {
                amount = -Math.abs(amount);
            }

            // Parse installments
            let installmentCurrent: number | undefined;
            let installmentTotal: number | undefined;

            if (installmentStr) {
                const parts = installmentStr.split('/');
                installmentCurrent = parseInt(parts[0]);
                installmentTotal = parseInt(parts[1]);
            } else if (singleInstallment && singleInstallment !== '01') {
                installmentCurrent = parseInt(singleInstallment);
            }

            // Determine currency
            let currency: 'ARS' | 'USD' = 'ARS';
            const usdIndicators = ['APPLE.COM', 'GOOGLE', 'MICROSOFT', 'CHESS.COM', 'YOUTUBE', 'NETFLIX', 'BILL', 'FACEBK'];
            const isUSD = usdIndicators.some(ind => description.toUpperCase().includes(ind));

            if (isUSD || (cardName.toLowerCase().includes('visa') && Math.abs(amount) < 150)) {
                currency = 'USD';
            }

            // Clean description - remove trailing markers
            description = description
                .replace(/\s+Deb\.Aut\.?\s*$/i, '')
                .replace(/\s+Zeta\s*$/i, '')
                .replace(/\s+\d{2}\/\d{2}\s*$/, '')
                .replace(/\s+\d{2}\s*$/, '')
                .replace(/\s+\d{9,}\s*$/, '') // Remove long IDs like "000000001113912"
                .trim();

            transactions.push({
                date,
                description,
                amount,
                currency,
                installmentCurrent,
                installmentTotal,
                isPlanZ,
                cardName,
                couponNumber,
            });
        }
    }

    // Deduplicate transactions by coupon number, date and amount to avoid repeats from different sections of the PDF
    const uniqueTransactions = new Map<string, ParsedTransaction>();
    for (const tx of transactions) {
        const key = `${tx.date.toISOString()}|${tx.cardName}|${tx.couponNumber || ''}|${tx.amount}|${tx.description}`;
        if (!uniqueTransactions.has(key)) {
            uniqueTransactions.set(key, tx);
        }
    }

    return Array.from(uniqueTransactions.values());
}

/**
 * Parse adjustments (Taxes/Commissions) from Naranja X statement
 */
function parseNaranjaAdjustments(text: string): ParsedAdjustment[] {
    const adjustments: ParsedAdjustment[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Pattern for IVA RG 4240: "18/12/25 NX Visa 2329 IVA RG 4240 21% SERV. DIGITAL 01 5.643,53"
        // We want the last number as amount, and we capture the card name
        const ivaMatch = trimmed.match(/(\d{2}\/\d{2}\/\d{2})\s+(NX\s*Virtual|Naranja\s*X|NX\s*Visa|NX\s*Master(?:card)?)\s+\d+\s+IVA\s+RG\s+4240.*?([\d.,]+)\s*$/i);
        if (ivaMatch) {
            const amount = parseArgentineNumber(ivaMatch[3]);
            if (amount > 10) {
                adjustments.push({
                    type: 'TAX',
                    description: 'IVA Servicios Digitales (RG 4240)',
                    amount,
                    currency: 'ARS',
                    cardName: ivaMatch[2].replace(/\s+/g, ' ').trim()
                });
                continue;
            }
        }

        // Pattern for Percepción RG 5617: "18/12/25 NX Visa 3299 PERCEPCION RG 5617 ARCA (52.274,97) 01 15.682,49"
        const percepcionMatch = trimmed.match(/(\d{2}\/\d{2}\/\d{2})\s+(NX\s*Virtual|Naranja\s*X|NX\s*Visa|NX\s*Master(?:card)?)\s+\d+\s+PERCEPCION\s+RG\s+5617.*?([\d.,]+)\s*$/i);
        if (percepcionMatch) {
            const amount = parseArgentineNumber(percepcionMatch[3]);
            if (amount > 10) {
                adjustments.push({
                    type: 'TAX',
                    description: 'Percepción RG 5617 ARCA',
                    amount,
                    currency: 'ARS',
                    cardName: percepcionMatch[2].replace(/\s+/g, ' ').trim()
                });
                continue;
            }
        }

        // Pattern for Impuesto de Sellos in "Otros cargos" section
        const sellosMatch = trimmed.match(/Impuesto\s+de\s+Sellos\s+([\d.,]+)/i);
        if (sellosMatch) {
            const amount = parseArgentineNumber(sellosMatch[1]);
            if (amount > 0) {
                adjustments.push({
                    type: 'TAX',
                    description: 'Impuesto de Sellos',
                    amount,
                    currency: 'ARS',
                });
                continue;
            }
        }

        // Other potential charges
        const mantenimientoMatch = trimmed.match(/Mantenimiento\s+de\s+Cuenta\s+([\d.,]+)/i);
        if (mantenimientoMatch) {
            const amount = parseArgentineNumber(mantenimientoMatch[1]);
            if (amount > 0) {
                adjustments.push({
                    type: 'COMMISSION',
                    description: 'Mantenimiento de Cuenta',
                    amount,
                    currency: 'ARS',
                });
                continue;
            }
        }

        const cobranzasMatch = trimmed.match(/GESTION\s+DE\s+COBRANZAS\s+([\d.,]+)/i);
        if (cobranzasMatch) {
            const amount = parseArgentineNumber(cobranzasMatch[1]);
            if (amount > 0) {
                adjustments.push({
                    type: 'COMMISSION',
                    description: 'Gestión de Cobranzas',
                    amount,
                    currency: 'ARS',
                });
                continue;
            }
        }
    }

    return adjustments;
}

/**
 * Calculate breakdown by card
 */
function calculateCardBreakdown(transactions: ParsedTransaction[]): Array<{
    cardName: string;
    totalARS: number;
    totalUSD: number;
    transactionCount: number;
}> {
    const breakdown: Map<string, { totalARS: number; totalUSD: number; count: number }> = new Map();

    for (const tx of transactions) {
        if (tx.isPayment) continue;

        const cardName = tx.cardName || 'Unknown';
        const current = breakdown.get(cardName) || { totalARS: 0, totalUSD: 0, count: 0 };

        if (tx.currency === 'ARS') {
            current.totalARS += tx.amount;
        } else {
            current.totalUSD += tx.amount;
        }
        current.count++;

        breakdown.set(cardName, current);
    }

    return Array.from(breakdown.entries()).map(([cardName, data]) => ({
        cardName,
        totalARS: data.totalARS,
        totalUSD: data.totalUSD,
        transactionCount: data.count,
    }));
}
