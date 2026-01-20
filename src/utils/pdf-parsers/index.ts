/**
 * PDF Parser Router
 * Detects institution and delegates to the appropriate parser
 */

import type { ParsedStatement, InstitutionCode } from '@/src/types';
import { extractTextFromPDF, detectInstitution } from '../pdf-parser';
import { parseGaliciaStatement } from './galicia-parser';
import { parseNacionStatement } from './nacion-parser';
import { parseNaranjaStatement } from './naranja-parser';
import { parseRiojaStatement } from './rioja-parser';

export interface ParsePDFResult {
    success: boolean;
    statement?: ParsedStatement;
    error?: string;
    rawText?: string;
}

/**
 * Parse a PDF statement file
 * @param fileBuffer - The PDF file as ArrayBuffer
 * @param intendedInstitution - The institution the user is currently in (to validate)
 * @param password - Optional password for encrypted PDFs
 * @returns Parsed statement data or error
 */
export async function parsePDFStatement(
    fileBuffer: ArrayBuffer,
    intendedInstitution?: InstitutionCode,
    password?: string
): Promise<ParsePDFResult> {
    try {
        // Extract text from PDF
        const { text, numPages } = await extractTextFromPDF(fileBuffer, password);

        if (!text || text.trim().length === 0) {
            return {
                success: false,
                error: 'No se pudo extraer texto del PDF. El archivo puede estar dañado o vacío.',
                rawText: text,
            };
        }

        // Detect institution
        const detectedInstitution = detectInstitution(text);

        if (!detectedInstitution) {
            return {
                success: false,
                error: 'No se pudo detectar la institución del resumen. Asegúrate de que sea un resumen de Galicia, Banco Nación, Naranja X o Banco Rioja.',
                rawText: text,
            };
        }

        // Validate intended institution
        if (intendedInstitution) {
            // Map common names to slugs
            const nameToSlug: Record<string, InstitutionCode> = {
                'galicia': 'galicia',
                'banco galicia': 'galicia',
                'nacion': 'nacion',
                'banco nacion': 'nacion',
                'banco nación': 'nacion',
                'naranja': 'naranja',
                'naranja x': 'naranja',
                'rioja': 'rioja',
                'banco rioja': 'rioja'
            };

            const intendedSlug = nameToSlug[intendedInstitution.toLowerCase()] || intendedInstitution.toLowerCase();

            if (detectedInstitution !== intendedSlug) {
                const instNames: Record<string, string> = {
                    'galicia': 'Banco Galicia',
                    'nacion': 'Banco Nación',
                    'naranja': 'Naranja X',
                    'rioja': 'Banco Rioja'
                };
                return {
                    success: false,
                    error: `Este resumen parece ser de ${instNames[detectedInstitution] || detectedInstitution}, pero estás subiéndolo en ${intendedInstitution}. Por favor, selecciona la institución correcta e intenta de nuevo.`,
                    rawText: text,
                };
            }
        }

        const institution = detectedInstitution;

        // Parse based on institution
        let statement: ParsedStatement;

        switch (institution) {
            case 'galicia':
                statement = parseGaliciaStatement(text);
                break;
            case 'nacion':
                statement = parseNacionStatement(text);
                break;
            case 'naranja':
                statement = parseNaranjaStatement(text);
                break;
            case 'rioja':
                statement = parseRiojaStatement(text);
                break;
            default:
                return {
                    success: false,
                    error: `Institución "${institution}" no soportada todavía.`,
                    rawText: text,
                };
        }

        return {
            success: true,
            statement,
        };
    } catch (error) {
        // Handle password error
        if (error instanceof Error) {
            if (error.message.includes('password') || error.message.includes('No password')) {
                return {
                    success: false,
                    error: 'El PDF está protegido con contraseña. Por favor ingresa la contraseña.',
                };
            }
            if (error.message.includes('Incorrect Password')) {
                return {
                    success: false,
                    error: 'Contraseña incorrecta. Por favor verifica la contraseña e intenta de nuevo.',
                };
            }
        }

        console.error('Error parsing PDF:', error);
        return {
            success: false,
            error: `Error al procesar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        };
    }
}

// Re-export parsers for direct use if needed
export { parseGaliciaStatement } from './galicia-parser';
export { parseNacionStatement } from './nacion-parser';
export { parseNaranjaStatement } from './naranja-parser';
export { parseRiojaStatement } from './rioja-parser';
