/**
 * Banco Nación PDF Parser
 * Handles VISA and Mastercard statements
 */

import type {
    ParsedStatement,
    ParsedTransaction,
    ParsedAdjustment,
    CardType,
} from '@/src/types';
import {
    parseArgentineNumber,
    parseDate,
} from '../pdf-parser';

/**
 * Parse a Banco Nación credit card statement
 */
export function parseNacionStatement(text: string): ParsedStatement {
    const fullText = text;

    // Detect card type
    let cardType: CardType = 'visa';
    let cardProvider: 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER' = 'VISA';

    if (fullText.toLowerCase().includes('mastercard')) {
        cardType = 'mastercard';
        cardProvider = 'MASTERCARD';
    }

    // Extract closing date
    let closingDate = new Date();
    const closingPatterns = [
        /(?:CIERRE\s+ACTUAL|Estado\s+de\s+cuenta\s+al)[:\s]*(\d{1,2}[\s-]\w+[\s-]\d{2,4})/i,
        /FECHA\s+DE\s+CIERRE[:\s]+(\d{1,2}[\/-]\w+[\/-]\d{2,4})/i,
    ];

    for (const pattern of closingPatterns) {
        const match = fullText.match(pattern);
        if (match) {
            const parsed = parseDate(match[1]);
            if (parsed) {
                closingDate = parsed;
                break;
            }
        }
    }

    // Extract due date
    let dueDate = new Date();
    const duePatterns = [
        /VENCIMIENTO\s+(?:ACTUAL)?[:\s]*(\d{1,2}[\s-]\w+[\s-]\d{2,4})/i,
        /Vencimiento\s+actual[:\s]*(\d{1,2}-\w+-\d{2,4})/i,
        /VTO\.?\s*(?:ACTUAL)?[:\s]+(\d{1,2}\s+\w+\s+\d{2,4})/i,
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

    // Extract previous dates
    let previousClosingDate: Date | undefined;
    const prevClosingMatch = fullText.match(/Cierre\s+Anterior[:\s]*(\d{1,2}-\w+-\d{2,4})/i);
    if (prevClosingMatch) {
        previousClosingDate = parseDate(prevClosingMatch[1]) || undefined;
    }

    let previousDueDate: Date | undefined;
    const prevDueMatch = fullText.match(/(?:Vencimiento\s+Anterior|VTO\.?\s+ANTERIOR)[:\s]*(\d{1,2}[\s-]\w+[\s-]\d{2,4})/i);
    if (prevDueMatch) {
        previousDueDate = parseDate(prevDueMatch[1]) || undefined;
    }

    // Extract next dates
    let nextClosingDate: Date | undefined;
    const nextClosingPatterns = [
        /(?:PROXIMO\s+CIERRE|Cierre\s+del\s+proximo\s+resumen)[:\s]*(\d{1,2}[\s\/-]\w+[\s\/-]\d{2,4}|\d{1,2}[\/-]\d{1,2})/i,
    ];

    for (const pattern of nextClosingPatterns) {
        const match = fullText.match(pattern);
        if (match) {
            let dateStr = match[1];
            if (!dateStr.match(/\d{2,4}$/)) {
                const nextMonth = parseInt(dateStr.split(/[\/-]/)[1]);
                const closingMonth = closingDate.getMonth() + 1;
                let year = closingDate.getFullYear();
                if (nextMonth < closingMonth) year++;
                dateStr = `${dateStr}/${year}`;
            }
            nextClosingDate = parseDate(dateStr) || undefined;
            if (nextClosingDate) break;
        }
    }

    let nextDueDate: Date | undefined;
    const nextDuePatterns = [
        /(?:PROXIMO\s+(?:VTO|VENCIMIENTO)|Vencimiento\s+del\s+proximo\s+resumen)[:\s.]*(\d{1,2}[\s\/-]\w+[\s\/-]\d{2,4}|\d{1,2}[\/-]\d{1,2})/i,
    ];

    for (const pattern of nextDuePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            let dateStr = match[1];
            if (!dateStr.match(/\d{2,4}$/)) {
                const nextMonth = parseInt(dateStr.split(/[\/-]/)[1]);
                const closingMonth = closingDate.getMonth() + 1;
                let year = closingDate.getFullYear();
                if (nextMonth < closingMonth) year++;
                dateStr = `${dateStr}/${year}`;
            }
            nextDueDate = parseDate(dateStr) || undefined;
            if (nextDueDate) break;
        }
    }

    // Extract balances and payments
    let previousBalance = 0;
    const prevBalanceMatch = fullText.match(/SALDO\s+(?:PENDIENTE|ANTERIOR)\s+\$?\s*([\d.,]+)/i);
    if (prevBalanceMatch) {
        previousBalance = parseArgentineNumber(prevBalanceMatch[1]);
    }

    let paymentMade = 0;
    const paymentMatch = fullText.match(/(?:SU\s+)?PAGO\s+(?:EN\s+PESOS)?\s+\$?\s*(-?[\d.,]+)/i);
    if (paymentMatch) {
        paymentMade = Math.abs(parseArgentineNumber(paymentMatch[1]));
    }

    let totalAmount = 0;
    const totalMatch = fullText.match(/SALDO\s+ACTUAL\s+\$?\s*([\d.,]+)/i);
    if (totalMatch) {
        totalAmount = parseArgentineNumber(totalMatch[1]);
    }

    let minimumPayment: number | undefined;
    const minPayMatch = fullText.match(/PAGO\s+(?:MINIMO|MIN\.?)[:\s$]*([\d.,]+)/i);
    if (minPayMatch) {
        minimumPayment = parseArgentineNumber(minPayMatch[1]);
    }

    // Parse transactions and adjustments
    const { transactions, adjustments } = parseNacionTransactionsAndAdjustments(fullText);

    // Add previous balance as adjustment if positive
    if (previousBalance > 0) {
        adjustments.push({
            type: 'OTHER',
            description: 'Saldo Pendiente Anterior',
            amount: previousBalance,
            currency: 'ARS',
        });
    }

    const statementMonth = closingDate.getMonth() + 1;
    const statementYear = closingDate.getFullYear();

    return {
        institution: 'nacion',
        cardType,
        cardProvider,
        closingDate,
        dueDate,
        statementMonth,
        statementYear,
        previousClosingDate,
        previousDueDate,
        nextClosingDate,
        nextDueDate,
        previousBalance,
        paymentMade,
        totalAmount,
        minimumPayment,
        transactions,
        adjustments,
        rawText: text,
    };
}

/**
 * Parse transactions and adjustments from Banco Nación statement
 * Combined approach for better accuracy
 */
function parseNacionTransactionsAndAdjustments(text: string): {
    transactions: ParsedTransaction[],
    adjustments: ParsedAdjustment[]
} {
    const transactions: ParsedTransaction[] = [];
    const adjustments: ParsedAdjustment[] = [];
    const lines = text.split('\n');

    let inTransactionSection = false;
    let inAdjustmentSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Detect transaction section start
        if (line.match(/FECHA\s+COMPROBANTE|DETALLES\s+DEL\s+MES|CUOTAS\s+DEL\s+MES/i)) {
            inTransactionSection = true;
            inAdjustmentSection = false;
            continue;
        }

        // Detect adjustment section (after transactions)
        if (line.match(/(?:TARJETA|TOTAL\s+(?:CONSUMOS|TITULAR))/i)) {
            inTransactionSection = false;
            inAdjustmentSection = true;
            continue;
        }

        // Stop at certain markers
        if (line.match(/^SALDO\s+ACTUAL|^PAGO\s+MINIMO|DEBITAREMOS/i)) {
            inTransactionSection = false;
            inAdjustmentSection = false;
            continue;
        }

        // === PARSE PAYMENTS ===
        // Mastercard: "19-Dic-25   SU PAGO   -56890,00"
        // Visa: "SU PAGO EN PESOS   -5.436,00"
        const paymentMatch = line.match(/^(\d{2}[\.-]\w{3}[\.-]\d{2}|\d{2}\.\d{2}\.\d{2})\s+(?:SU\s+)?PAGO(?:\s+EN\s+PESOS)?\s+(-?[\d.,]+)/i);
        if (paymentMatch) {
            const date = parseDate(paymentMatch[1]);
            if (date) {
                transactions.push({
                    date,
                    description: 'SU PAGO',
                    amount: Math.abs(parseArgentineNumber(paymentMatch[2])),
                    currency: 'ARS',
                    isPlanZ: false,
                    isPayment: true,
                });
            }
            continue;
        }

        // === PARSE MASTERCARD TRANSACTIONS ===
        // Format: "12-Sep-25   ONCITYCOM   04/12   02654   61250,00"
        const mcMatch = line.match(/^(\d{2}-\w{3}-\d{2})\s+([A-Z][A-Z0-9*\s]+?)\s+(\d{2}\/\d{2})\s+(\d+)\s+([\d.,]+)/i);
        if (mcMatch && inTransactionSection) {
            const date = parseDate(mcMatch[1]);
            if (!date) continue;

            const description = mcMatch[2].replace(/\s+/g, ' ').trim();
            if (description.includes('PAGO') || description.includes('TOTAL')) continue;

            const installmentStr = mcMatch[3];
            const couponNumber = mcMatch[4];
            const amount = parseArgentineNumber(mcMatch[5]);

            if (amount <= 0) continue;

            let installmentCurrent: number | undefined;
            let installmentTotal: number | undefined;

            if (installmentStr) {
                const parts = installmentStr.split('/');
                installmentCurrent = parseInt(parts[0]);
                installmentTotal = parseInt(parts[1]);
            }

            transactions.push({
                date,
                description,
                amount,
                currency: 'ARS',
                installmentCurrent,
                installmentTotal,
                isPlanZ: false,
                couponNumber,
            });
            continue;
        }

        // === PARSE VISA TRANSACTIONS ===
        // Format with installments: "16.09.25   586756   MERPAGO*NIKEARGENTIN   C.04/12   33.133,08   0,00"
        // Format without: "29.11.25   008184   WWW.FRAVEGA.COM-BNA   8.333,25   0,00"
        const visaMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+(\d+)\s+([A-Z0-9*][^\s]+(?:\s+[A-Z0-9*][^\s]+)*?)\s+(?:C\.?)?(\d{2}\/\d{2})?\s+([\d.,]+)(?:\s+([\d.,]+))?$/i);
        if (visaMatch && inTransactionSection) {
            const date = parseDate(visaMatch[1]);
            if (!date) continue;

            const couponNumber = visaMatch[2];
            const description = visaMatch[3].trim();
            const installmentStr = visaMatch[4];
            const amountARS = parseArgentineNumber(visaMatch[5]);
            const amountUSD = visaMatch[6] ? parseArgentineNumber(visaMatch[6]) : 0;

            if (description.includes('PAGO') || description.includes('TOTAL')) continue;

            // Determine which amount to use (ARS if > 0, else USD)
            const amount = amountARS > 0.01 ? amountARS : amountUSD;
            const currency = amountARS > 0.01 ? 'ARS' : 'USD';

            if (Math.abs(amount) < 0.01) continue;

            let installmentCurrent: number | undefined;
            let installmentTotal: number | undefined;

            if (installmentStr) {
                const parts = installmentStr.split('/');
                installmentCurrent = parseInt(parts[0]);
                installmentTotal = parseInt(parts[1]);
            }

            transactions.push({
                date,
                description,
                amount,
                currency,
                installmentCurrent,
                installmentTotal,
                isPlanZ: false,
                couponNumber,
            });
            continue;
        }

        // === PARSE ADJUSTMENTS ===
        if (inAdjustmentSection || !inTransactionSection) {
            // Impuesto de Sellos
            const sellosMatch = line.match(/IMPUESTO\s+DE\s+SELLOS\s+\$?\s*([\d.,]+)/i);
            if (sellosMatch) {
                adjustments.push({
                    type: 'TAX',
                    description: 'Impuesto de Sellos',
                    amount: parseArgentineNumber(sellosMatch[1]),
                    currency: 'ARS',
                });
                continue;
            }

            // Intereses Financiación
            const interesesMatch = line.match(/INTERESES\s+(?:DE\s+)?FINANCIACION\s+\$?\s*([\d.,]+)/i);
            if (interesesMatch) {
                adjustments.push({
                    type: 'INTEREST',
                    description: 'Intereses Financiación',
                    amount: parseArgentineNumber(interesesMatch[1]),
                    currency: 'ARS',
                });
                continue;
            }

            // Intereses Compensatorios
            const compensMatch = line.match(/INTERESES\s+COMPENSATORIOS\s+\$?\s*([\d.,]+)/i);
            if (compensMatch) {
                adjustments.push({
                    type: 'INTEREST',
                    description: 'Intereses Compensatorios',
                    amount: parseArgentineNumber(compensMatch[1]),
                    currency: 'ARS',
                });
                continue;
            }

            // Punitorios (varios formatos)
            const punitMatch = line.match(/(?:INTERESES\s+PUNITORIOS|PUNIT\.?\s+PAG\.?MIN\.?ANTERIOR)\s+\$?\s*([\d.,]+)/i);
            if (punitMatch) {
                adjustments.push({
                    type: 'INTEREST',
                    description: 'Intereses Punitorios',
                    amount: parseArgentineNumber(punitMatch[1]),
                    currency: 'ARS',
                });
                continue;
            }

            // IVA 21%
            const ivaMatch = line.match(/(?:DB\s+)?IVA\s+(?:\$\s*)?21[,.]?0?%\s+\$?\s*([\d.,]+)/i);
            if (ivaMatch) {
                adjustments.push({
                    type: 'TAX',
                    description: 'IVA 21%',
                    amount: parseArgentineNumber(ivaMatch[1]),
                    currency: 'ARS',
                });
                continue;
            }
        }
    }

    return { transactions, adjustments };
}
