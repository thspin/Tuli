/**
 * Galicia Bank PDF Parser
 * Handles VISA and American Express statements
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
 * Parse a Galicia bank credit card statement
 */
export function parseGaliciaStatement(text: string): ParsedStatement {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const fullText = text;

    // Detect card type
    let cardType: CardType = 'visa';
    let cardProvider: 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER' = 'VISA';

    if (fullText.toLowerCase().includes('american express') || fullText.toLowerCase().includes('amex')) {
        cardType = 'amex';
        cardProvider = 'AMEX';
    } else if (fullText.toLowerCase().includes('mastercard')) {
        cardType = 'mastercard';
        cardProvider = 'MASTERCARD';
    }

    // Extract closing date: "CIERRE ACTUAL: 31 Dic 25" or "CIERRE ACTUAL 31/12/25"
    let closingDate = new Date();
    const closingPatterns = [
        /CIERRE\s+ACTUAL[:\s]+(\d{1,2}\s+\w+\s+\d{2,4})/i,
        /CIERRE\s+ACTUAL[:\s]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
        /CIERRE\s+DEL\s+RESUMEN[:\s]+(\d{1,2}[\s\/\.-]+\w+[\s\/\.-]+\d{2,4})/i,
        /FECHA\s+DE\s+CIERRE[:\s]+(\d{1,2}[\s\/\.-]+\w+[\s\/\.-]+\d{2,4})/i
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

    // Extract due date: "VENCIMIENTO ... 09 Ene 26" or "Vencimiento: 09/01/26"
    let dueDate = new Date();
    const duePatterns = [
        /VENCIMIENTO\s+SALDO.*?(\d{1,2}\s+\w+\s+\d{2})/i, // With intermediate text
        /VENCIMIENTO[:\s]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
        /FECHA\s+DE\s+VENCIMIENTO[:\s]+(\d{1,2}[\s\/\.-]+\w+[\s\/\.-]+\d{2,4})/i,
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

    // Extract previous closing date
    let previousClosingDate: Date | undefined;
    const prevClosingMatch = fullText.match(/CIERRE\s+ANTERIOR[:\s]+(\d{1,2}\s+\w+\s+\d{2,4})/i);
    if (prevClosingMatch) {
        previousClosingDate = parseDate(prevClosingMatch[1]) || undefined;
    }

    // Extract previous due date
    let previousDueDate: Date | undefined;
    const prevDueMatch = fullText.match(/VTO\.?\s+ANTERIOR[:\s]+(\d{1,2}\s+\w+\s+\d{2,4})/i);
    if (prevDueMatch) {
        previousDueDate = parseDate(prevDueMatch[1]) || undefined;
    }

    // Extract previous balance
    let previousBalance = 0;
    const prevBalanceMatch = fullText.match(/SALDO\s+ANTERIOR\s+([\d.,]+)\s+[\d,]+/i);
    if (prevBalanceMatch) {
        previousBalance = parseArgentineNumber(prevBalanceMatch[1]);
    }

    // Extract payment made
    let paymentMade = 0;
    const paymentMatch = fullText.match(/SU\s+PAGO\s+EN\s+PESOS\s+([\d.,]+)-?/i);
    if (paymentMatch) {
        paymentMade = parseArgentineNumber(paymentMatch[1]);
    }

    // Extract total amount
    let totalAmount = 0;
    const totalMatch = fullText.match(/SALDO\s+ACTUAL\s+\$?\s*([\d.,]+)/i);
    if (totalMatch) {
        totalAmount = parseArgentineNumber(totalMatch[1]);
    }

    // Extract minimum payment
    let minimumPayment: number | undefined;
    const minPayMatch = fullText.match(/PAGO\s+MINIMO[:\s$]*([\d.,]+)/i);
    if (minPayMatch) {
        minimumPayment = parseArgentineNumber(minPayMatch[1]);
    }

    // Parse transactions and adjustments
    const { transactions, adjustments } = parseGaliciaTransactionsAndAdjustments(fullText);

    // Calculate balance difference from previous statement
    if (paymentMade > 0 && previousBalance > 0) {
        const balanceDiff = paymentMade - previousBalance;
        if (balanceDiff > 0) {
            adjustments.push({
                type: 'CREDIT',
                description: 'Saldo a Favor (Pago Anterior)',
                amount: -balanceDiff,
                currency: 'ARS',
            });
        }
    }

    const statementMonth = closingDate.getMonth() + 1;
    const statementYear = closingDate.getFullYear();

    return {
        institution: 'galicia',
        cardType,
        cardProvider,
        closingDate,
        dueDate,
        statementMonth,
        statementYear,
        previousClosingDate,
        previousDueDate,
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
 * Parse transactions and adjustments from Galicia statement
 * Combined approach for better accuracy
 */
function parseGaliciaTransactionsAndAdjustments(text: string): {
    transactions: ParsedTransaction[],
    adjustments: ParsedAdjustment[]
} {
    const transactions: ParsedTransaction[] = [];
    const adjustments: ParsedAdjustment[] = [];
    const lines = text.split('\n');

    let inTransactionSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Detect start of transaction section
        if (line.match(/FECHA\s+COMPROBANTE\s+DETALLE/i)) {
            inTransactionSection = true;
            continue;
        }

        // Stop at separator line or totals
        if (line.match(/^_{5,}|SALDO\s+ACTUAL|PAGO\s+MINIMO/i)) {
            inTransactionSection = false;
            continue;
        }

        // === PARSE PAYMENTS ===
        const paymentMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+SU\s+PAGO\s+EN\s+PESOS\s+([\d.,]+)-?/i);
        if (paymentMatch) {
            const date = parseDate(paymentMatch[1]);
            if (date) {
                transactions.push({
                    date,
                    description: 'SU PAGO EN PESOS',
                    amount: parseArgentineNumber(paymentMatch[2]),
                    currency: 'ARS',
                    isPlanZ: false,
                    isPayment: true,
                });
            }
            continue;
        }

        // === PARSE REGULAR TRANSACTIONS ===
        // Pattern: "DD.MM.YY NNNNNN* DESCRIPTION [Cuota XX/YY] AMOUNT"
        const txMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+(\d+\*?)\s+(.+?)\s+(?:Cuota\s+)?(\d{1,2}\/\d{1,2})?\s*([\d.,]+)$/i);
        if (txMatch && inTransactionSection) {
            const date = parseDate(txMatch[1]);
            if (!date) continue;

            const couponNumber = txMatch[2];
            let description = txMatch[3].trim();
            const installmentStr = txMatch[4];
            const amount = parseArgentineNumber(txMatch[5]);

            if (amount <= 0) continue;

            // Parse installments
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

        // === PARSE ADJUSTMENTS WITH DATES ===

        // "CARGO POR GESTION DE COBRANZA" - special case, has date but no coupon
        const gestionMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+CARGO\s+POR\s+GESTION\s+DE\s+COBRANZA\s+([\d.,]+)/i);
        if (gestionMatch) {
            adjustments.push({
                type: 'COMMISSION',
                description: 'Gestión de Cobranza',
                amount: parseArgentineNumber(gestionMatch[2]),
                currency: 'ARS',
            });
            continue;
        }

        // Impuesto de Sellos
        const sellosMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+IMPUESTO\s+DE\s+SELLOS\s+\$?\s*([\d.,]+)/i);
        if (sellosMatch) {
            adjustments.push({
                type: 'TAX',
                description: 'Impuesto de Sellos',
                amount: parseArgentineNumber(sellosMatch[2]),
                currency: 'ARS',
            });
            continue;
        }

        // Intereses Financiación
        const interesesMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+INTERESES\s+FINANCIACION\s+\$?\s*([\d.,]+)/i);
        if (interesesMatch) {
            adjustments.push({
                type: 'INTEREST',
                description: 'Intereses Financiación',
                amount: parseArgentineNumber(interesesMatch[2]),
                currency: 'ARS',
            });
            continue;
        }

        // Punitorios - TWO COLUMNS: "31.12.25 PUNIT. PAG.MIN.ANTERIOR $ 13.600,48 881,14"
        // We want the SECOND number (881,14)
        const punitoriosMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+PUNIT\.?\s+PAG\.?MIN\.?ANTERIOR\s+\$?\s*([\d.,]+)\s+([\d.,]+)/i);
        if (punitoriosMatch) {
            // Take the second column
            adjustments.push({
                type: 'INTEREST',
                description: 'Intereses Punitorios',
                amount: parseArgentineNumber(punitoriosMatch[3]),
                currency: 'ARS',
            });
            continue;
        }

        // IVA 21% - TWO COLUMNS: "31.12.25 DB IVA $ 21% 3.538,30 743,04"
        // We want the SECOND number (743,04)
        const ivaMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+DB\s+IVA\s+\$?\s*21%\s+([\d.,]+)\s+([\d.,]+)/i);
        if (ivaMatch) {
            // Take the second column
            adjustments.push({
                type: 'TAX',
                description: 'IVA 21%',
                amount: parseArgentineNumber(ivaMatch[3]),
                currency: 'ARS',
            });
            continue;
        }

        // Valor Mínimo Sellos
        const valorMinimoMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+DEB\.?\s+VALOR\s+MINIMO\s+SELLOS\s+\$?\s*([\d.,]+)/i);
        if (valorMinimoMatch) {
            const amount = parseArgentineNumber(valorMinimoMatch[2]);
            // Validation: should be small (< $1000)
            if (amount > 0 && amount < 1000) {
                adjustments.push({
                    type: 'TAX',
                    description: 'Valor Mínimo Sellos',
                    amount,
                    currency: 'ARS',
                });
            }
            continue;
        }
    }

    return { transactions, adjustments };
}
