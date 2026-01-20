/**
 * Base PDF Parser Utility
 * Uses pdf-parse v1.x for PDF text extraction (Node.js compatible)
 */

import type { ParsedStatement, InstitutionCode } from '@/src/types';

/**
 * Extract text from a PDF file
 * @param fileBuffer - The PDF file as an ArrayBuffer
 * @param password - Optional password for encrypted PDFs
 * @returns The extracted text content
 */
export async function extractTextFromPDF(
    fileBuffer: ArrayBuffer,
    password?: string
): Promise<{ text: string; numPages: number }> {
    // If password is provided, use pdfjs-dist directly (pdf-parse v1.x doesn't support passwords)
    if (password) {
        return extractTextWithPdfjs(fileBuffer, password);
    }

    // For non-protected PDFs, use pdf-parse v1.x (simpler and more reliable)
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = Buffer.from(fileBuffer);

    try {
        const data = await pdfParse(buffer);
        return {
            text: data.text,
            numPages: data.numpages,
        };
    } catch (error: any) {
        // Handle password-protected PDFs
        if (
            error.message?.includes('password') ||
            error.message?.includes('encrypted') ||
            error.name === 'PasswordException'
        ) {
            throw new Error('El PDF está protegido con contraseña. Por favor ingresa la contraseña.');
        }
        throw error;
    }
}

/**
 * Extract text using pdfjs-dist directly (supports passwords)
 */
async function extractTextWithPdfjs(
    fileBuffer: ArrayBuffer,
    password: string
): Promise<{ text: string; numPages: number }> {
    // Use pdfjs-dist legacy build
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const data = new Uint8Array(fileBuffer);

    try {
        const loadingTask = pdfjsLib.getDocument({
            data: data,
            password: password,
            // @ts-ignore - disableWorker exists in legacy build but maybe not in types
            disableWorker: true,
            isEvalSupported: false,
        });

        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item: any) => ('str' in item ? item.str : ''))
                .join(' ');
            fullText += pageText + '\n';
        }

        return { text: fullText, numPages: pdf.numPages };
    } catch (error: any) {
        if (error.message?.includes('password') || error.name === 'PasswordException') {
            throw new Error('Contraseña incorrecta. Por favor verifica e intenta de nuevo.');
        }
        throw error;
    }
}

/**
 * Detect which institution the PDF belongs to
 * @param text - The extracted text from the PDF
 * @returns The detected institution code
 */
export function detectInstitution(text: string): InstitutionCode | null {
    const lowerText = text.toLowerCase();

    // Naranja X detection - check FIRST because some Naranja statements 
    // may reference other bank CUITs for payments
    if (
        lowerText.includes('naranjax') ||
        lowerText.includes('naranja x') ||
        lowerText.includes('www.naranjax.com') ||
        lowerText.includes('30-68537634-9') || // CUIT de Naranja
        (lowerText.includes('naranja') && lowerText.includes('resumen de cuenta'))
    ) {
        return 'naranja';
    }

    // Galicia detection
    if (
        lowerText.includes('banco de galicia') ||
        lowerText.includes('bancogalicia') ||
        (lowerText.includes('galicia') && lowerText.includes('saldo actual'))
    ) {
        return 'galicia';
    }

    // Banco Nación detection
    if (
        lowerText.includes('banco nacion') ||
        lowerText.includes('banco nación') ||
        lowerText.includes('30-50001091-2') // CUIT del Banco Nación
    ) {
        return 'nacion';
    }

    // Rioja detection
    if (
        lowerText.includes('banco rioja') ||
        lowerText.includes('bancorioja') ||
        lowerText.includes('nuevo banco de la rioja') ||
        lowerText.includes('www.bancorioja.com.ar') ||
        lowerText.includes('30-50000661-7') || // CUIT de Banco Rioja
        lowerText.includes('30500006617') || // CUIT sin guiones
        (lowerText.includes('rioja') && lowerText.includes('mastercard')) ||
        (lowerText.includes('rioja') && lowerText.includes('saldo actual'))
    ) {
        return 'rioja';
    }

    return null;
}

/**
 * Parse a number from Argentine format (1.234,56 or 1234,56)
 * @param str - The string containing the number
 * @returns The parsed number
 */
export function parseArgentineNumber(str: string): number {
    if (!str) return 0;

    // Remove spaces and normalize
    let cleaned = str.trim();

    // Handle negative numbers (can have - at start or end, or be in parentheses)
    let isNegative = false;
    if (cleaned.startsWith('-') || cleaned.endsWith('-')) {
        isNegative = true;
        cleaned = cleaned.replace(/-/g, '');
    }
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
        isNegative = true;
        cleaned = cleaned.slice(1, -1);
    }

    // Remove currency symbols and extra characters
    cleaned = cleaned.replace(/[$\s]/g, '');

    // Argentine format: 1.234,56 (dots for thousands, comma for decimal)
    // Remove thousand separators (dots)
    cleaned = cleaned.replace(/\./g, '');
    // Replace decimal separator (comma) with dot
    cleaned = cleaned.replace(',', '.');

    const num = parseFloat(cleaned);
    return isNegative ? -num : (isNaN(num) ? 0 : num);
}

/**
 * Parse a date from various formats
 * Common formats: DD/MM/YY, DD/MM/YYYY, DD.MM.YY, "31 Dic 25"
 */
export function parseDate(str: string): Date | null {
    if (!str) return null;

    const cleaned = str.trim();

    // Format: "31 Dic 25" or "31 Dic 2025"
    const monthNames: { [key: string]: number } = {
        'ene': 0, 'jan': 0,
        'feb': 1,
        'mar': 2,
        'abr': 3, 'apr': 3,
        'may': 4,
        'jun': 5,
        'jul': 6,
        'ago': 7, 'aug': 7,
        'sep': 8, 'set': 8,
        'oct': 9,
        'nov': 10,
        'dic': 11, 'dec': 11,
    };

    // Try "DD Mon YY" format (flexible separators: space, dash, slash, dot)
    // Matches: "31 Dic 25", "31-Dic-25", "31/Dic/25", "31.Dic.25"
    const textMatch = cleaned.match(/(\d{1,2})[\s\/\.-]+([a-zA-Z]{3})[\s\/\.-]+(\d{2,4})/i);
    if (textMatch) {
        const day = parseInt(textMatch[1]);
        const monthStr = textMatch[2].toLowerCase();
        let year = parseInt(textMatch[3]);
        if (year < 100) year += 2000;

        const month = monthNames[monthStr];
        if (month !== undefined) {
            // Set time to 15:00 local time (which is 12:00 UTC for Argentina UTC-3)
            // This ensures the date stays the same when converted to/from UTC
            return new Date(year, month, day, 15, 0, 0);
        }
    }

    // Try DD/MM/YY or DD/MM/YYYY or DD.MM.YY (numeric month)
    const slashMatch = cleaned.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
    if (slashMatch) {
        const day = parseInt(slashMatch[1]);
        const month = parseInt(slashMatch[2]) - 1; // 0-indexed
        let year = parseInt(slashMatch[3]);
        if (year < 100) year += 2000;

        // Set time to 15:00 local time to avoid timezone issues
        return new Date(year, month, day, 15, 0, 0);
    }

    return null;
}

/**
 * Calculate similarity between two strings (0-100)
 * Used for fuzzy matching transaction descriptions
 */
export function stringSimilarity(str1: string, str2: string): number {
    // Normalization helper
    const normalize = (s: string) => {
        return s.toLowerCase()
            // Remove common bank prefixes (Galicia, ICBC, etc often use these)
            .replace(/^[a-z]{1,3}\*/gi, '')
            // Remove installment info at the end like (Cuota 1/3) or /03
            .replace(/\(cuota\s*\d+\/\d+\)$|cuota\s*\d+\/\d+$|\d+\/\d+$/gi, '')
            .trim();
    };

    const n1 = normalize(str1);
    const n2 = normalize(str2);

    // Exact match after normalization
    if (n1 === n2 && n1.length > 0) return 95;

    // Remove all non-alphanumeric for a "super-clean" comparison
    const s1 = n1.replace(/[^a-z0-9]/g, '');
    const s2 = n2.replace(/[^a-z0-9]/g, '');

    if (s1 === s2 && s1.length > 0) return 90;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Check if one contains the other (very common in bank descriptions)
    if (s1.includes(s2) || s2.includes(s1)) {
        return 85;
    }

    // Word-based matching (more robust)
    const words1 = n1.split(/[\s*._/-]+/).filter(w => w.length >= 3);
    const words2 = n2.split(/[\s*._/-]+/).filter(w => w.length >= 3);

    if (words1.length === 0 || words2.length === 0) return 10;

    const commonWords = words1.filter(w1 =>
        words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
    );

    if (commonWords.length > 0) {
        // Find the most significant match
        const longestMatch = Math.max(...commonWords.map(w => w.length));

        if (longestMatch >= 5) return 80;
        if (longestMatch >= 3) return 60;

        return 20 + (commonWords.length * 15);
    }

    // Fallback to Levenshtein-style quick check
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length > shorter.length * 2) return 10;

    return 10;
}

/**
 * Check if two amounts match (exact centavos match)
 */
export function amountsMatch(amount1: number, amount2: number): boolean {
    // Round to 2 decimal places and compare
    const rounded1 = Math.round(amount1 * 100) / 100;
    const rounded2 = Math.round(amount2 * 100) / 100;
    return rounded1 === rounded2;
}

/**
 * Check if two dates are within N days of each other
 */
export function datesWithinDays(date1: Date, date2: Date, days: number = 1): boolean {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    return daysDiff <= days;
}

/**
 * Extract installment info from a string like "02/06" or "Cuota 02/06"
 */
export function parseInstallments(str: string): { current: number; total: number } | null {
    const match = str.match(/(\d{1,2})\s*[\/de]\s*(\d{1,2})/);
    if (match) {
        return {
            current: parseInt(match[1]),
            total: parseInt(match[2]),
        };
    }
    return null;
}
