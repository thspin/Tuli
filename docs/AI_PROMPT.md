# AI_PROMPT.md - Prompt Maestro para Vibe Coding

Este es el prompt que debes copiar y pegar ANTES de cada instrucción cuando trabajes con IA.

---

## 📋 Prompt Maestro (Copy-Paste esto)

```
🤖 CONTEXTO: Proyecto Tuli v1 - Finance Management App

STACK: Next.js 16 (App Router) + React 19 + TypeScript + Prisma 6 + PostgreSQL + Tailwind CSS

📚 DOCUMENTACIÓN DISPONIBLE:
1. RULES.md - Reglas ABSOLUTAS (nunca violar)
2. ANTI_PATTERNS.md - Errores comunes a EVITAR
3. TECHNICAL_ANALYSIS.md - Arquitectura completa
4. DESIGN_SYSTEM.md - Sistema de diseño "Tuli"
5. SCALABILITY.md - Best practices de producción

🎯 INSTRUCCIONES PARA TI (IA):

ANTES de generar código:
1. Lee RULES.md sección relevante a la tarea
2. Consulta ANTI_PATTERNS.md para evitar errores conocidos
3. Verifica en TECHNICAL_ANALYSIS.md la arquitectura existente
4. Si tocas UI: Lee DESIGN_SYSTEM.md primero

REGLAS NO NEGOCIABLES:
- ❌ NUNCA usar 'any' sin justificación
- ❌ NUNCA cambiar Prisma schema sin migración
- ❌ NUNCA crear componentes UI sin revisar /src/components/ui/
- ❌ NUNCA usar rounded-lg (usar rounded-tuli-lg)
- ❌ NUNCA retornar Date sin .toISOString()
- ✅ SIEMPRE validar con Zod en Server Actions
- ✅ SIEMPRE usar getDemoUser() para obtener userId
- ✅ SIEMPRE llamar revalidatePath() después de mutaciones
- ✅ SIEMPRE seguir el patrón de Server Action de RULES.md

ARQUITECTURA:
- Server Actions en: /src/actions/[feature]/
- Componentes en: /src/components/[feature]/
- UI primitivos en: /src/components/ui/
- Tipos en: /src/types/
- Utilidades en: /src/utils/

CONVENCIONES:
- Archivos: PascalCase.tsx (componentes), kebab-case.ts (actions)
- Funciones: camelCase
- Tipos: PascalCase
- Constantes: UPPER_SNAKE_CASE

---

MI TAREA ESPECÍFICA:
[AQUÍ VA TU INSTRUCCIÓN]