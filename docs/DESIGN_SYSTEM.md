# Tuli v1 - Sistema de Diseño Glassmorphism 2.0

**Versión:** 2.0.0  
**Fecha:** 2026-01-16  
**Estado:** Implementado

---

## 📋 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Paleta de Colores](#2-paleta-de-colores)
3. [Efectos de Cristal](#3-efectos-de-cristal)
4. [Componentes UI](#4-componentes-ui)
5. [Clases Utility](#5-clases-utility)
6. [Animaciones](#6-animaciones)
7. [Accesibilidad](#7-accesibilidad)
8. [Ejemplos de Uso](#8-ejemplos-de-uso)

---

## 1. Introducción

El Sistema de Diseño Glassmorphism 2.0 de Tuli es una implementación moderna y premium del efecto "frosted glass" (cristal esmerilado), inspirado en:

- **Apple macOS Big Sur** - Efectos de transparencia y blur
- **Windows 11 Mica** - Capas de profundidad
- **iOS Widgets** - Bordes luminosos sutiles

### Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Blur Controlado** | 10-20px de blur (no excesivo) |
| **Transparencia Sutil** | 5-25% opacity para fondos |
| **Bordes Luminosos** | Bordes blancos con 18-30% opacity |
| **Sombras Difusas** | Sin sombras duras, todo difuminado |
| **Gradientes Vibrantes** | Fondos animados sutilmente |
| **Contraste Inteligente** | Text-shadow para legibilidad |

---

## 2. Paleta de Colores

### Background Principal

```css
/* Gradiente animado principal */
background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%);
background-size: 200% 200%;
animation: gradient-shift 15s ease infinite;
```

### Variantes de Gradiente

| Variante | Clase CSS | Uso |
|----------|-----------|-----|
| **Primario** | `.glass-bg-animated` | Background principal |
| **Oscuro** | `.glass-bg-dark` | Modo oscuro alternativo |
| **Púrpura** | `.glass-bg-purple` | Acento especial |

### Colores Semánticos

```css
/* Acentos para métricas */
--success: #10b981;  /* Ingresos, positivos */
--destructive: #ef4444;  /* Gastos, negativos */
--info: #3b82f6;  /* Neutral, informativo */
--warning: #f59e0b;  /* Alertas */
```

### Colores de Texto

| Tipo | Color | Uso |
|------|-------|-----|
| **Primario** | `text-white` | Títulos, valores importantes |
| **Secundario** | `text-white/80` | Subtítulos, labels |
| **Terciario** | `text-white/60` | Texto de soporte |
| **Muted** | `text-white/40` | Placeholders, hints |

---

## 3. Efectos de Cristal

### Variables CSS

```css
:root {
  --glass-white: rgba(255, 255, 255, 0.1);
  --glass-white-strong: rgba(255, 255, 255, 0.25);
  --glass-white-subtle: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-border-strong: rgba(255, 255, 255, 0.3);
  --glass-shadow: rgba(31, 38, 135, 0.15);
  --glass-blur: 16px;
}
```

### Niveles de Blur

| Nivel | Valor | Uso |
|-------|-------|-----|
| **SM** | `blur(10px)` | Elementos pequeños, badges |
| **MD** | `blur(16px)` | Cards, contenedores ← DEFAULT |
| **LG** | `blur(24px)` | Sidebar, modales |
| **XL** | `blur(40px)` | Backdrop de modales |

### Sombras Glassmorphism

```typescript
// tailwind.config.ts
boxShadow: {
  'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
  'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.2)',
  'glass-card': '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
}
```

---

## 4. Componentes UI

### Card

```tsx
import { Card, MetricCard } from '@/src/components/ui';

// Card estándar
<Card variant="default" padding="md" hover>
  {children}
</Card>

// Card elevada (más blur, más prominente)
<Card variant="elevated" padding="lg">
  {children}
</Card>

// Card oscura (para elementos secundarios)
<Card variant="dark" padding="sm">
  {children}
</Card>

// Metric Card (para métricas del dashboard)
<MetricCard
  icon={<span className="material-symbols-outlined">account_balance</span>}
  label="Balance Total"
  value="$1,234,567"
  trend={{ value: 12.5, isPositive: true }}
  glow="blue"
/>
```

#### Card Variants

| Variant | Background | Blur | Uso |
|---------|-----------|------|-----|
| `default` | `rgba(255,255,255,0.1)` | 16px | Cards principales |
| `elevated` | `rgba(255,255,255,0.15)` | 20px | Cards destacadas |
| `dark` | `rgba(255,255,255,0.05)` | 20px | Cards secundarias |
| `flat` | `rgba(255,255,255,0.05)` | 0px | Sin blur |

### Button

```tsx
import Button from '@/src/components/ui/Button';

// Primary (gradiente azul)
<Button variant="primary" glow>Guardar</Button>

// Secondary (glass simple)
<Button variant="secondary">Cancelar</Button>

// Success (gradiente verde)
<Button variant="success">Confirmar</Button>

// Danger (gradiente rojo)
<Button variant="danger">Eliminar</Button>

// Ghost (transparente)
<Button variant="ghost">Más opciones</Button>

// Glass (efecto cristal puro)
<Button variant="glass">Acción</Button>
```

### Input

```tsx
import Input, { Textarea, SearchInput } from '@/src/components/ui/Input';

// Input básico
<Input
  label="Nombre"
  placeholder="Ingresa tu nombre"
  error="Campo requerido"
/>

// Input con icono
<Input
  label="Monto"
  icon={<span className="material-symbols-outlined">attach_money</span>}
/>

// Textarea
<Textarea
  label="Descripción"
  placeholder="Agrega una nota..."
/>

// Search Input
<SearchInput placeholder="Buscar transacciones..." />
```

### Modal

```tsx
import Modal, { ModalFooter, ConfirmModal } from '@/src/components/ui/Modal';

// Modal estándar
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Título del Modal"
  description="Descripción opcional"
  size="md"
  icon={<span className="material-symbols-outlined">add</span>}
>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setOpen(false)}>
      Cancelar
    </Button>
    <Button variant="primary">
      Guardar
    </Button>
  </ModalFooter>
</Modal>

// Modal de confirmación
<ConfirmModal
  isOpen={open}
  onClose={() => setOpen(false)}
  onConfirm={() => handleDelete()}
  title="¿Eliminar transacción?"
  description="Esta acción no se puede deshacer"
  variant="danger"
/>
```

### Alert

```tsx
import Alert, { Toast } from '@/src/components/ui/Alert';

// Alert informativo
<Alert variant="info" title="Información" glow>
  Tu resumen está listo para descargar.
</Alert>

// Alert de éxito
<Alert variant="success" title="¡Listo!" onClose={() => {}}>
  Transacción guardada correctamente.
</Alert>

// Toast notification
<Toast variant="error" message="Error al procesar" />
```

### Loading States

```tsx
import { LoadingSpinner, LoadingOverlay, Skeleton, CardSkeleton } from '@/src/components/ui/LoadingSpinner';

// Spinner simple
<LoadingSpinner size="md" color="blue" />

// Overlay de carga completo
<LoadingOverlay message="Cargando datos..." />

// Skeleton para contenido
<Skeleton width="100%" height="1rem" rounded="md" />

// Card skeleton
<CardSkeleton />
```

---

## 5. Clases Utility

### Clases de Cristal Base

```css
.glass                   /* Efecto cristal estándar */
.glass-card             /* Card con cristal */
.glass-card-elevated    /* Card elevada */
.glass-card-dark        /* Card oscura */
.glass-input            /* Input con efecto hundido */
.glass-button           /* Botón de cristal */
.glass-modal            /* Modal con cristal */
.glass-modal-backdrop   /* Backdrop de modal */
.glass-sidebar          /* Sidebar translúcido */
.glass-badge            /* Badge con cristal */
```

### Clases de Hover

```css
.glass-hover            /* Hover interactivo */
.glass-active           /* Estado activo */
```

### Clases de Glow

```css
.glass-glow-success     /* Glow verde */
.glass-glow-error       /* Glow rojo */
.glass-glow-info        /* Glow azul */
.glass-glow-warning     /* Glow amarillo */
```

### Clases de Texto

```css
.glass-text             /* Text-shadow para legibilidad */
.glass-text-strong      /* Text-shadow más fuerte */
.text-gradient          /* Texto con gradiente azul-púrpura */
.text-gradient-warm     /* Texto con gradiente cálido */
.text-gradient-cool     /* Texto con gradiente frío */
```

### Clases de Animación

```css
.glass-bg-animated      /* Background con animación de gradiente */
.glass-shimmer          /* Efecto shimmer para loading */
.glass-pulse            /* Pulso de glow */
.glass-float            /* Flotación suave */
```

---

## 6. Animaciones

### Gradient Shift

```css
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
/* Duración: 15s */
```

### Glass Shimmer

```css
@keyframes glass-shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
/* Uso: Loading placeholders */
```

### Glass Pulse

```css
@keyframes glass-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }
}
/* Uso: Alertas importantes */
```

### Glass Float

```css
@keyframes glass-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
/* Uso: Elementos decorativos */
```

---

## 7. Accesibilidad

### Contraste de Texto

- **Mínimo WCAG AA:** 4.5:1
- Usar `.glass-text` para mejorar legibilidad sobre blur
- Textos importantes en blanco puro (`#ffffff`)

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .glass-bg-animated,
  .glass-shimmer,
  .glass-pulse,
  .glass-float {
    animation: none;
  }
}
```

### Focus States

```css
:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.8);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}
```

### Fallback para Navegadores Sin backdrop-filter

```css
@supports not (backdrop-filter: blur(10px)) {
  .glass, .glass-card, .glass-modal {
    background: rgba(30, 58, 138, 0.95);
  }
}
```

---

## 8. Ejemplos de Uso

### Dashboard Metric Card

```tsx
<div className="glass-card p-6 hover:shadow-glass-lg transition-all">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
      <span className="material-symbols-outlined text-white/80">
        account_balance
      </span>
    </div>
    <span className="text-sm text-white/60">Balance Total</span>
  </div>
  <h2 className="text-3xl font-black text-white glass-text">
    $103,000
  </h2>
  <div className="mt-2">
    <span className="glass-badge glass-badge-success">↑ 10.74%</span>
  </div>
</div>
```

### Sidebar Navigation Item

```tsx
<Link href="/accounts" className="group flex flex-col items-center gap-2">
  <div className={`
    w-14 h-14 rounded-[20px] flex items-center justify-center
    transition-all duration-300
    ${isActive
      ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/40'
      : 'text-white/60 group-hover:bg-white/10'
    }
  `}>
    <span className="material-symbols-outlined">account_balance_wallet</span>
  </div>
  <span className="text-[9px] font-bold tracking-widest uppercase text-white/40">
    Billetera
  </span>
</Link>
```

### Modal Header

```tsx
<div className="bg-white/5 px-8 py-6 border-b border-white/10 flex justify-between">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center">
      <span className="material-symbols-outlined text-white">add</span>
    </div>
    <div>
      <h3 className="text-xl font-bold text-white glass-text">Nuevo Ingreso</h3>
      <p className="text-white/50 text-sm">Añade un nuevo ingreso a tu cuenta</p>
    </div>
  </div>
  <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-400/10 hover:text-red-400 transition-all">
    <span className="material-symbols-outlined">close</span>
  </button>
</div>
```

---

## Archivos de Referencia

- **Tokens CSS:** `app/globals.css`
- **Tailwind Config:** `tailwind.config.ts`
- **Componentes UI:** `src/components/ui/`
- **Layout:** `src/components/layout/AppLayout.tsx`
- **Sidebar:** `src/components/layout/SlimSidebar.tsx`

---

**Última Actualización:** 2026-01-16  
**Autor:** Antigravity AI Agent
