# Tuli v1 - Plan de Migración a Motia + Rediseño Glassmorphism 2.0

**Fecha:** 2026-01-16  
**Estado:** En Progreso  
**Autor:** Antigravity AI Agent

---

## 📋 Tabla de Contenidos

1. [Análisis de Motia Framework](#1-análisis-de-motia-framework)
2. [Estrategia de Integración con Motia](#2-estrategia-de-integración-con-motia)
3. [Rediseño Glassmorphism 2.0](#3-rediseño-glassmorphism-20)
4. [Plan de Implementación Fase por Fase](#4-plan-de-implementación-fase-por-fase)
5. [Checklist de Migración](#5-checklist-de-migración)

---

## 1. Análisis de Motia Framework

### ⚠️ Clarificación Importante

**Motia NO es un reemplazo de Next.js**, sino un **framework backend complementario** diseñado para:

| Característica | Descripción |
|----------------|-------------|
| **Unified Backend** | Consolida APIs, background jobs, workflows en un solo runtime |
| **Polyglot Support** | TypeScript + Python en el mismo proyecto |
| **Event-Driven** | Steps que se comunican por eventos |
| **Observability** | Workbench visual para debugging |
| **AI-First** | Diseñado para workflows de IA |

### ¿Qué significa esto para Tuli v1?

Tu proyecto **YA está bien estructurado** con Next.js App Router + Server Actions. Una "migración a Motia" implicaría:

1. ✅ **MANTENER**: Todo el frontend Next.js (páginas, componentes, UI)
2. ✅ **MANTENER**: Schema de Prisma intacto
3. ✅ **MANTENER**: Sistema de diseño Tuli
4. 🔄 **OPCIONAL**: Mover lógica pesada de PDF parsing a Motia Steps
5. 🔄 **OPCIONAL**: Usar Motia para background jobs (cálculo de tipos de cambio)

### Recomendación

**Para Tuli v1**, dado que:
- Es un proyecto financiero en producción
- Los Server Actions ya funcionan bien
- No hay requisitos de AI agents o workflows complejos

**→ NO recomiendo una migración completa a Motia en este momento.**

En cambio, recomiendo:
1. **Priorizar el rediseño UI Glassmorphism 2.0** (impacto visual inmediato)
2. **Evaluar Motia** en el futuro para:
   - PDF parsing asíncrono con progreso
   - Sync automático de tipos de cambio (cron jobs)
   - Integraciones bancarias futuras

---

## 2. Estrategia de Integración con Motia (Futuro)

### Arquitectura Propuesta (Si se implementa)

```
┌─────────────────────────────────────────┐
│         Next.js Frontend (Tuli)         │
│  ├── /app (Rutas y Páginas)             │
│  ├── /src/components (UI)               │
│  └── /src/actions (Server Actions)      │
│         ↓ HTTP calls al backend         │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│           Motia Backend                  │
│  ├── /steps/pdf-parser.step.ts          │
│  ├── /steps/exchange-rate.step.py       │
│  ├── /steps/reconciliation.step.ts      │
│  └── /flows/import-statement.flow.ts    │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│         PostgreSQL Database             │
│         (Prisma Schema intacto)         │
└─────────────────────────────────────────┘
```

### Pasos para Integrar (Cuando sea necesario)

```bash
# 1. Instalar Motia
npx motia create --dir ./motia-backend

# 2. Configurar Prisma Client en Motia
# (Mismo schema, compartido entre proyectos)

# 3. Crear Steps para lógica pesada
# /motia-backend/steps/pdf-parser.step.ts

# 4. Conectar Next.js con Motia API
# fetch('http://localhost:3001/api/parse-pdf')
```

---

## 3. Rediseño Glassmorphism 2.0

### 3.1 Principios de Diseño

| Principio | Descripción | Valor CSS |
|-----------|-------------|-----------|
| **Blur controlado** | 10-20px (NO 40px+) | `backdrop-filter: blur(16px)` |
| **Transparencia sutil** | 5-25% opacity | `rgba(255,255,255,0.1)` |
| **Bordes luminosos** | Muy sutiles | `border: 1px solid rgba(255,255,255,0.18)` |
| **Sombras difusas** | Sin sombras duras | `box-shadow: 0 8px 32px rgba(31,38,135,0.15)` |
| **Gradientes vibrantes** | Fondo animado | `linear-gradient(135deg, #667eea, #764ba2)` |
| **Texto legible** | Text-shadow para contraste | `text-shadow: 0 2px 8px rgba(0,0,0,0.3)` |

### 3.2 Paleta de Colores Glassmorphism

#### Background Principal (Body)
```css
background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%);
```

#### Variantes de Cristal
| Elemento | Background | Blur | Border |
|----------|-----------|------|---------|
| **Card estándar** | `rgba(255,255,255,0.1)` | `16px` | `rgba(255,255,255,0.18)` |
| **Card elevada** | `rgba(255,255,255,0.15)` | `20px` | `rgba(255,255,255,0.25)` |
| **Card oscura** | `rgba(255,255,255,0.05)` | `20px` | `rgba(255,255,255,0.1)` |
| **Input hundido** | `rgba(255,255,255,0.05)` | `8px` | `rgba(255,255,255,0.1)` |
| **Modal** | `rgba(255,255,255,0.15)` | `24px` | `rgba(255,255,255,0.2)` |

#### Colores de Acento (Para métricas)
| Estado | Color | Glow |
|--------|-------|------|
| **Positivo** | `#10b981` | `0 0 20px rgba(16,185,129,0.4)` |
| **Negativo** | `#ef4444` | `0 0 20px rgba(239,68,68,0.4)` |
| **Neutral** | `#3b82f6` | `0 0 20px rgba(59,130,246,0.4)` |

#### Texto sobre Glassmorphism
| Tipo | Color | Text-Shadow |
|------|-------|-------------|
| **Primario** | `#ffffff` | `0 2px 8px rgba(0,0,0,0.3)` |
| **Secundario** | `rgba(255,255,255,0.8)` | Ninguno |
| **Terciario** | `rgba(255,255,255,0.6)` | Ninguno |

### 3.3 Componentes a Rediseñar

#### Prioridad Alta (Core UI)
- [x] `globals.css` - Variables CSS y estilos base
- [x] `tailwind.config.ts` - Tokens Glassmorphism
- [ ] `AppLayout.tsx` - Background gradient animado
- [ ] `SlimSidebar.tsx` - Sidebar de cristal
- [ ] `Card.tsx` - Glass card component
- [ ] `Button.tsx` - Glass buttons
- [ ] `Input.tsx` - Glass inputs
- [ ] `Modal.tsx` - Glass modals

#### Prioridad Media (Feature Components)
- [ ] `ProductCard.tsx` - Tarjetas de crédito glassmórficas
- [ ] `TopHeader.tsx` - Header con blur
- [ ] `MoneyInput.tsx` - Input de dinero mejorado
- [ ] Dashboard cards
- [ ] Gráficos (contenedores)

#### Prioridad Baja (Polish)
- [ ] Tooltips con glassmorphism
- [ ] Loading states (shimmer glass)
- [ ] Empty states
- [ ] Badges y chips

---

## 4. Plan de Implementación Fase por Fase

### Fase 1: Fundación (Día 1)
1. ✅ Actualizar `tailwind.config.ts` con tokens Glassmorphism
2. ✅ Reescribir `globals.css` con variables y utilities
3. Crear clases utility `.glass-*`
4. Implementar animaciones

### Fase 2: Layout (Día 2)
1. Rediseñar `AppLayout.tsx` con gradient background
2. Transformar `SlimSidebar.tsx` a cristal translúcido
3. Actualizar `TopHeader.tsx` (si existe)

### Fase 3: Componentes UI (Días 3-4)
1. Rediseñar `Card.tsx` a glass card
2. Actualizar `Button.tsx` variantes
3. Transformar `Input.tsx` / `Select.tsx`
4. Rediseñar `Modal.tsx`

### Fase 4: Feature Components (Días 5-6)
1. Actualizar `ProductCard.tsx`
2. Rediseñar dashboard cards
3. Mejorar `MoneyInput.tsx`
4. Gráficos y contenedores

### Fase 5: Polish (Día 7)
1. Animaciones y transiciones
2. Loading states
3. Testing de accesibilidad
4. Performance check

---

## 5. Checklist de Migración

### ✅ Preparación
- [x] Leer documentación técnica existente
- [x] Analizar estructura del proyecto
- [x] Entender sistema de diseño actual
- [x] Investigar Motia framework

### ✅ Fase 1: Fundación (COMPLETADA)
- [x] Actualizar `tailwind.config.ts` con tokens Glassmorphism
- [x] Actualizar `globals.css` con variables y utilities
- [x] Crear clases utility glass
- [x] Implementar animaciones (gradient-shift, shimmer, pulse, float)

### ✅ Fase 2: Layout (COMPLETADA)
- [x] Rediseñar `AppLayout.tsx` con gradient background y orbs flotantes
- [x] Transformar `SlimSidebar.tsx` a cristal translúcido
- [x] Dashboard page con métricas glassmórficas

### ✅ Fase 3: Componentes UI (COMPLETADA)
- [x] Rediseñar `Card.tsx` a glass card (+ MetricCard)
- [x] Actualizar `Button.tsx` variantes (+ IconButton)
- [x] Transformar `Input.tsx` (+ Textarea, SearchInput)
- [x] Actualizar `Select.tsx` (+ MultiSelect)
- [x] Rediseñar `Modal.tsx` (+ ModalFooter, ConfirmModal)
- [x] Actualizar `Alert.tsx` (+ Toast)
- [x] Mejorar `LoadingSpinner.tsx` (+ LoadingOverlay, Skeleton, CardSkeleton)

### ⏳ Pendiente (Fase 4-5)
- [ ] Actualizar `ProductCard.tsx`
- [x] Actualizar feature components:
  - [x] `AccountsClient.tsx` - Billetera
  - [x] `TransactionsClient.tsx` - Transacciones
  - [x] `ServicesClient.tsx` - Servicios
  - [x] `BillsManager.tsx` - Gestión de boletas
  - [x] `ServiceList.tsx` - Lista de servicios
  - [x] `NotesClient.tsx` - Notas
  - [x] `NoteCard.tsx` - Tarjetas de notas
  - [x] `CompletedNoteRow.tsx` - Notas completadas
  - [x] `CalendarClient.tsx` - Calendario
  - [x] `AddTransactionButton.tsx` - Modal de agregado (parcial)
- [ ] Actualizar `MoneyInput.tsx`
- [ ] Testing de accesibilidad completo
- [ ] Testing de performance
- [x] Documentación `DESIGN_SYSTEM.md` actualizada

---

## 📝 Notas Importantes

### Compatibilidad
- `backdrop-filter` no funciona en Firefox Android
- Usar fallback con `@supports`
- Testear en Chrome, Firefox, Safari

### Performance
- Blur puede impactar performance en dispositivos antiguos
- Limitar animaciones con `prefers-reduced-motion`
- Usar `will-change` con moderación

### Accesibilidad
- Contraste mínimo 4.5:1 (WCAG AA)
- Focus states visibles
- Text-shadow para legibilidad

---

**Próximo paso:** Implementar Fase 1 - Fundación del sistema de diseño Glassmorphism 2.0
