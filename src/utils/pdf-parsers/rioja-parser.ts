import { ParsedStatement, ParsedTransaction, ParsedAdjustment } from '@/src/types';
import { parseArgentineNumber, parseDate } from '../pdf-parser';

export function parseRiojaStatement(text: string): ParsedStatement {
    let closingDate: Date | null = null;
    let dueDate: Date | null = null;
    let totalAmountArs = 0;
    let totalAmountUsd = 0;
    let previousBalance = 0;
    let paymentMade = 0;
    let minimumPayment = 0;

    // Clean text for some regexes but keep original for line processing
    const onelineText = text.replace(/\s+/g, ' ');

    // 1. Extract Dates
    // "Estado de cuenta al: 31-Dic-25" or "al:31-Dic-25"
    const closingPatterns = [
        /Estado\s+de\s+cuenta\s+al:\s*(\d{1,2}-\w{3}-\d{2,4})/i,
        /al:\s*(\d{1,2}-\w{3}-\d{2,4})/i,
        /CIERRE\s+ACTUAL[:\s]+(\d{1,2}[\s\/-]\w{3}[\s\/-]\d{2,4})/i,
        /FECHA\s+DE\s+CIERRE[:\s]+(\d{1,2}[\s\/-]\w{3}[\s\/-]\d{2,4})/i,
    ];

    for (const pattern of closingPatterns) {
        const match = onelineText.match(pattern);
        if (match) {
            closingDate = parseDate(match[1]);
            if (closingDate) break;
        }
    }

    // Try to find specific due date "Vencimiento actual: 15-Ene-26"
    const duePatterns = [
        /Vencimiento\s+actual:\s*(\d{1,2}-\w{3}-\d{2,4})/i,
        /VENCIMIENTO[:\s]+(\d{1,2}[\s\/-]\w{3}[\s\/-]\d{2,4})/i,
        /FECHA\s+DE\s+VENCIMIENTO[:\s]+(\d{1,2}[\s\/-]\w{3}[\s\/-]\d{2,4})/i
    ];

    for (const pattern of duePatterns) {
        const match = onelineText.match(pattern);
        if (match) {
            dueDate = parseDate(match[1]);
            if (dueDate) break;
        }
    }

    // Fallback: default due date 10 days after closing if not found
    if (closingDate && !dueDate) {
        dueDate = new Date(closingDate);
        dueDate.setDate(dueDate.getDate() + 10);
    }

    if (!closingDate) {
        // Last resort: try to find any date that looks like a closing date
        const anyDateMatch = onelineText.match(/(\d{1,2}-\w{3}-\d{2,4})/);
        if (anyDateMatch) {
            closingDate = parseDate(anyDateMatch[1]);
            if (closingDate) {
                dueDate = new Date(closingDate);
                dueDate.setDate(dueDate.getDate() + 10);
            }
        }
    }

    if (!closingDate) {
        throw new Error('No se pudo encontrar la fecha de cierre en el resumen de Banco Rioja');
    }

    // 2. Extract Amounts from "RESUMEN CONSOLIDADO" section
    // Extract SALDO ACTUAL from the consolidated table
    // Pattern: "SALDO ACTUAL 9510,53 0,00" or "Saldo actual: $ 9510,53"
    const saldoActualPatterns = [
        /SALDO\s+ACTUAL\s+([\d.,]+)\s+([\d.,]+)/i,
        /Saldo\s+actual:\s*\$?\s*([\d.,]+)/i
    ];

    for (const pattern of saldoActualPatterns) {
        const match = onelineText.match(pattern);
        if (match) {
            totalAmountArs = parseArgentineNumber(match[1]);
            if (match[2]) {
                totalAmountUsd = parseArgentineNumber(match[2]);
            }
            break;
        }
    }

    // Extract SALDO ANTERIOR
    const saldoAnteriorPatterns = [
        /SALDO\s+ANTERIOR\s+([\d.,]+)\s+([\d.,]+)/i,
        /Saldo\s+Anterior\s*:?\s*\$?\s*([\d.,]+)/i
    ];

    for (const pattern of saldoAnteriorPatterns) {
        const match = onelineText.match(pattern);
        if (match) {
            previousBalance = parseArgentineNumber(match[1]);
            break;
        }
    }

    // Extract PAGO MINIMO
    const minPayPatterns = [
        /PAGO\s+MINIMO\s+([\d.,]+)/i,
        /Pago\s+M[ií]nimo:\s*\$?\s*([\d.,]+)/i,
        /pago\s+m[gí]nimo\s+de\s*\$?\s*([\d.,]+)/i
    ];

    for (const pattern of minPayPatterns) {
        const match = onelineText.match(pattern);
        if (match) {
            minimumPayment = parseArgentineNumber(match[1]);
            break;
        }
    }

    // 3. Parse Transactions and Adjustments
    const { transactions, adjustments } = parseRiojaTransactionsAndAdjustments(text);

    // Calculate payments made from transactions
    const paymentTransactions = transactions.filter(t => t.isPayment);
    if (paymentTransactions.length > 0) {
        paymentMade = paymentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }

    return {
        institution: 'rioja',
        cardType: 'mastercard',
        cardProvider: 'MASTERCARD',
        closingDate,
        dueDate: dueDate || closingDate,
        statementMonth: closingDate.getMonth() + 1,
        statementYear: closingDate.getFullYear(),
        previousBalance,
        paymentMade,
        totalAmount: totalAmountArs,
        totalAmountUSD: totalAmountUsd,
        minimumPayment,
        transactions,
        adjustments,
        rawText: text
    };
}

function parseRiojaTransactionsAndAdjustments(text: string): {
    transactions: ParsedTransaction[],
    adjustments: ParsedAdjustment[]
} {
    const transactions: ParsedTransaction[] = [];
    const adjustments: ParsedAdjustment[] = [];

    const lines = text.split('\n');
    let inConsolidatedSection = false;
    let inDetailSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Detect RESUMEN CONSOLIDADO section
        if (line.match(/RESUMEN\s+CONSOLIDADO/i)) {
            inConsolidatedSection = true;
            inDetailSection = false;
            continue;
        }

        // Detect DETALLE DEL MES section
        if (line.match(/DETALLE\s+DEL\s+MES/i)) {
            inDetailSection = true;
            inConsolidatedSection = false;
            continue;
        }

        // Skip headers and limit lines
        if (line.match(/FECHA\s+CONCEPTO|PESOS\s+DOLARES|L[GÍI]MITE|LGMITE/i)) {
            continue;
        }

        // Stop processing at certain markers
        if (line.match(/Cuotas\s+a\s+vencer|Pague\s+su\s+resumen|Estimado/i)) {
            break;
        }

        // === PARSE CONSOLIDATED SECTION ===
        if (inConsolidatedSection) {
            // Pattern for lines with date and description: "10-Dic-25 PAGO CAJERO/INTERNET -983885,80"
            const dateLineMatch = line.match(/^(\d{2}-\w{3}-\d{2})\s+(.+?)\s+(-?[\d.,]+)(?:\s+([\d.,]+))?$/);
            if (dateLineMatch) {
                const date = parseDate(dateLineMatch[1]);
                const description = dateLineMatch[2].trim();
                const amountPesos = parseArgentineNumber(dateLineMatch[3]);
                const amountUsd = dateLineMatch[4] ? parseArgentineNumber(dateLineMatch[4]) : 0;

                if (date && Math.abs(amountPesos) > 0.01) {
                    const isPayment = description.toUpperCase().includes('PAGO') || amountPesos < 0;
                    transactions.push({
                        date,
                        description,
                        amount: Math.abs(amountPesos),
                        currency: 'ARS',
                        isPlanZ: false,
                        isPayment
                    });

                    // Add USD transaction if exists
                    if (Math.abs(amountUsd) > 0.01) {
                        transactions.push({
                            date,
                            description,
                            amount: Math.abs(amountUsd),
                            currency: 'USD',
                            isPlanZ: false,
                            isPayment
                        });
                    }
                }
                continue;
            }

            // Pattern for adjustment lines without date: "INTERESES PUNITORIOS 3967,38"
            const adjustmentMatch = line.match(/^([A-ZÁÉÍÓÚÑ\s\.%]+?)\s+([\d.,]+)(?:\s+([\d.,]+))?$/);
            if (adjustmentMatch) {
                const description = adjustmentMatch[1].trim();
                const amountPesos = parseArgentineNumber(adjustmentMatch[2]);

                // Skip if it's a total/saldo line (these were already captured)
                if (description.match(/^(SALDO|TOTAL|SUBTOTAL|PAGO)/i)) {
                    continue;
                }

                if (Math.abs(amountPesos) > 0.01) {
                    let type: 'INTEREST' | 'TAX' | 'COMMISSION' | 'OTHER' = 'OTHER';

                    if (description.match(/INTERES/i)) {
                        type = 'INTEREST';
                    } else if (description.match(/IMPUESTO|I\.?V\.?A\.?|SELLOS/i)) {
                        type = 'TAX';
                    } else if (description.match(/COMI[SN]|MANT|CUENTA/i)) {
                        type = 'COMMISSION';
                    }

                    adjustments.push({
                        type,
                        description,
                        amount: Math.abs(amountPesos),
                        currency: 'ARS'
                    });
                }
                continue;
            }
        }

        // === PARSE DETAIL SECTION ===
        if (inDetailSection) {
            // Pattern: "DD-MMM-YY DESCRIPTION COUPON AMOUNT [USD_AMOUNT]"
            const detailMatch = line.match(/^(\d{2}-\w{3}-\d{2})\s+(.+?)\s+(\d+)\s+(-?[\d.,]+)(?:\s+([\d.,]+))?$/);
            if (detailMatch) {
                const date = parseDate(detailMatch[1]);
                const description = detailMatch[2].trim();
                const couponNumber = detailMatch[3];
                const amountPesos = parseArgentineNumber(detailMatch[4]);
                const amountUsd = detailMatch[5] ? parseArgentineNumber(detailMatch[5]) : 0;

                if (date && Math.abs(amountPesos) > 0.01) {
                    const isPayment = description.toUpperCase().includes('PAGO') || amountPesos < 0;
                    transactions.push({
                        date,
                        description,
                        amount: Math.abs(amountPesos),
                        currency: 'ARS',
                        isPlanZ: false,
                        isPayment,
                        couponNumber
                    });

                    if (Math.abs(amountUsd) > 0.01) {
                        transactions.push({
                            date,
                            description,
                            amount: Math.abs(amountUsd),
                            currency: 'USD',
                            isPlanZ: false,
                            isPayment,
                            couponNumber
                        });
                    }
                }
            }
        }
    }

    return { transactions, adjustments };
}
