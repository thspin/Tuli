# Changelog

Todos los cambios notables del proyecto Tuli v1 se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### En Progreso
- Sistema de servicios recurrentes
- Gráficos de gastos por categoría
- Transferencias entre cuentas

## [0.1.0] - 2026-01-14

### Añadido
- Sistema completo de gestión de cuentas e instituciones financieras
- Transacciones (ingresos, egresos, transferencias)
- Sistema de cuotas con generación automática
- Resúmenes de tarjetas de crédito automáticos
- Importación de PDFs (Galicia, Nación, Naranja, Rioja)
- Reconciliación inteligente de transacciones
- Multi-moneda (ARS, USD, USDT, USDC, BTC)
- Sistema de diseño "Tuli" con Tailwind CSS
- Calendario financiero básico
- Notas y recordatorios
- Categorías personalizables
- Parser de números argentinos (1.234,56)

### Características Técnicas
- Next.js 16.1.1 con App Router
- React 19.2.3
- TypeScript 5.0+
- Prisma 6.0.0 + PostgreSQL
- Tailwind CSS 3.4.17
- PDF parsing con pdf-parse y pdfjs-dist

### Fase 1 (Completada)
- ✓ Gestión de instituciones y productos
- ✓ Sistema de transacciones básico
- ✓ Categorización manual
- ✓ Multi-moneda con conversión

### Fase 2 (80% Completada)
- ✓ Resúmenes de tarjetas
- ✓ Importación de PDFs
- ✓ UI moderna con animaciones
- ⏳ Servicios recurrentes (en progreso)

### Conocido
- Solo usuario demo (sin autenticación real)
- Tipo de cambio manual (no actualización automática)
- Sin paginación en listas grandes
- Sin tests unitarios/integración

### Planificado (Fase 3)
- Autenticación real con NextAuth.js
- Metas de ahorro y presupuestos
- Gráficos avanzados
- Exportación de datos (CSV/Excel)
- Tests automatizados
- Multi-tenant (varios usuarios)

---

[Unreleased]: https://github.com/user/tuli-v1/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/user/tuli-v1/releases/tag/v0.1.0
