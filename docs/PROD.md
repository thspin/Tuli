# Tuli - PRD (Product Requirements Document)

## Estado del Proyecto: ✅ Fase 1 Completada | 🚧 Fase 2 en Progreso

---

## 🗺️ ROADMAP DEL PROYECTO

### 📍 Fase 1: Fundamentos (✅ COMPLETADA)

**Objetivo:** Establecer la base del sistema de gestión financiera

- ✅ **Gestión de cuentas y productos**
  - Instituciones financieras (Bancos, Billeteras)
  - Productos (Tarjetas, Préstamos, Cuentas)
  - Gestión de efectivo
  
- ✅ **Transacciones (ingresos/egresos)**
  - Formularios de creación
  - Edición y eliminación
  - Soporte para cuotas
  
- ✅ **Categorización manual**
  - Crear/editar/eliminar categorías
  - Categorías de sistema
  - Iconos personalizables

**Estado:** ✅ 100% Completada

---

### 📍 Fase 2: Experiencia de Usuario (🚧 EN PROGRESO)

**Objetivo:** Mejorar la experiencia visual y funcionalidades core

- ✅ **Resúmenes de tarjetas**
  - Generación automática mensual
  - Visualización de transacciones
  - Proceso de pago
  
- ✅ **Multi-moneda**
  - Soporte ARS, USD, CRYPTO
  - Conversión automática
  - Visualización por moneda
  
- ✅ **Sistema de temas**
  - 3 temas (Light, Dark, Blue-Sober)
  - Persistencia de preferencias
  - Variables CSS OKLCH
  
- ✅ **UI moderna**
  - Componentes reutilizables
  - Diseño responsive
  - Animaciones suaves
  
- ❌ **Gestor de Servicios** (PENDIENTE)
  - Registro de servicios recurrentes
  - Alertas de vencimiento
  - Pago automático de servicios
  - Historial de pagos

**Estado:** 🚧 80% Completada (falta Gestor de Servicios)

---

### 📍 Fase 3: Automatización y Herramientas (❌ PLANIFICADA)

**Objetivo:** Automatizar procesos y agregar herramientas de productividad

- ❌ **Calendario Financiero**
  - Vista mensual de vencimientos
  - Recordatorios de pagos
  - Planificación de gastos futuros
  - Integración con resúmenes
  
- ❌ **Metas de ahorro e inversión**
  - Definir objetivos financieros
  - Tracking de progreso
  - Alertas de desviación
  
- ❌ **Transferencias entre cuentas**
  - Mover dinero entre productos
  - Historial de transferencias
  - Validación de saldos

**Estado:** ❌ 0% Completada

**Estimación:** 2-3 meses de desarrollo

---

### 📊 Progreso General del Proyecto

```
Fase 1: ████████████████████ 100% ✅
Fase 2: ████████████████░░░░  80% 🚧
Fase 3: ░░░░░░░░░░░░░░░░░░░░   0% ❌

Total:  ████████████░░░░░░░░  60% 
```

**Próximo Milestone:** Completar Gestor de Servicios (Fase 2)

---

## 1. OBJETIVO DEL PROYECTO ✅

**Objetivo Principal:**
Crear una aplicación integral de tracking de finanzas personales para que el usuario pueda alcanzar sus objetivos de ahorro e inversión.

**Problemas que Resuelve:**

1. ✅ Tedioso control manual de gastos e ingresos
2. ❌ Falta de planificación financiera (pendiente: herramientas de planificación)

---

## 2. MVP (Versión Mínima Viable) - Estado: ✅ COMPLETADO

### Funcionalidades Implementadas

#### ✅ 1. Gestión de Cuentas Financieras

- ✅ Crear instituciones financieras (Bancos, Billeteras Virtuales)
- ✅ Crear productos financieros dentro de instituciones
- ✅ Gestión de efectivo
- ✅ Soporte multi-moneda (ARS, USD)
- ✅ Conversión automática de monedas

#### ✅ 2. Registro de Transacciones

- ✅ Formulario de creación de gastos
- ✅ Formulario de creación de ingresos
- ✅ Categorización de transacciones
- ✅ Soporte para cuotas en tarjetas de crédito
- ✅ Cálculo automático de intereses

#### ✅ 3. Dashboard y Visualización

- ✅ Vista de todas las cuentas con saldos
- ✅ Resúmenes mensuales de tarjetas de crédito
- ✅ Visualización de transacciones por producto
- ✅ Balance total en múltiples monedas

#### ✅ 4. Gestión de Categorías

- ✅ Crear categorías personalizadas
- ✅ Categorías de ingresos y egresos
- ✅ Editar y eliminar categorías
- ✅ Categorías del sistema (no editables)

#### ✅ 5. Sistema de Resúmenes

- ✅ Generación automática de resúmenes mensuales
- ✅ Visualización de transacciones por resumen
- ✅ Proceso de pago de resúmenes
- ✅ Comprobantes de pago

---

## 3. REGLAS DE NEGOCIO - Cuentas ✅

### ✅ 3.1 Tipos de Cuentas Implementadas

- ✅ Efectivo (CASH)
- ✅ Bancos (instituciones con productos)
- ✅ Billeteras Virtuales (WALLET)
- ✅ Tarjetas de Crédito (CREDIT_CARD)
- ✅ Préstamos (LOAN)
- ✅ Cuentas Corrientes (CHECKING_ACCOUNT)
- ✅ Cajas de Ahorro (SAVINGS_ACCOUNT)
- ❌ Seguros (pendiente)
- ❌ Inversiones (pendiente)

### ✅ 3.2 Información de Cuentas

- ✅ Institución financiera
- ✅ Tipo de producto
- ✅ Fecha de vencimiento (tarjetas)
- ✅ Fecha de cierre (tarjetas)
- ✅ Límites de uso
- ✅ Saldo actual
- ✅ Moneda (ARS, USD, CRYPTO)
- ❌ Bonificaciones y recordatorios (pendiente)

### ✅ 3.3 Múltiples Cuentas

- ✅ Usuario puede tener múltiples cuentas del mismo tipo
- ✅ Múltiples instituciones
- ✅ Múltiples productos por institución

---

## 4. REGLAS DE NEGOCIO - Transacciones ✅

### ✅ 4.1 Tipos de Transacciones

- ✅ Ingresos (INCOME)
- ✅ Egresos (EXPENSE)
- ❌ Transferencias entre cuentas (pendiente)
- ✅ Deudas (mediante tarjetas de crédito y préstamos)

### ✅ 4.2 Información de Transacciones

- ✅ Monto
- ✅ Fecha
- ✅ Descripción
- ✅ Categoría
- ✅ Cuenta de origen
- ✅ Cuenta de destino (en transferencias)
- ❌ Recordatorios automáticos (pendiente)

### ✅ 4.3 Categorías

- ✅ Usuario puede crear categorías personalizadas
- ✅ Usuario puede editar/eliminar categorías
- ✅ Categorías del sistema protegidas
- ✅ Iconos personalizables (emojis)
- ❌ Personalización avanzada (pendiente)

### ✅ 4.4 Edición y Eliminación

- ✅ Usuario puede modificar transacciones
- ✅ Usuario puede eliminar transacciones
- ✅ Control total sobre los datos

---

## 5. REGLAS DE NEGOCIO - Deudas ✅

### ✅ 5.1 Modelo de Deudas

- ✅ Entidad separada (Productos tipo CREDIT_CARD y LOAN)
- ✅ Pagos parciales mediante resúmenes
- ✅ Intereses explícitos (cuotas con diferente valor)

### ✅ 5.2 Cuotas y Pagos

- ✅ Deudas con múltiples cuotas
- ✅ Cuotas con interés calculado
- ✅ Pago total de resúmenes
- ✅ Fechas de vencimiento
- ✅ Generación automática de cuotas futuras
- ✅ Visualización de próximo resumen

---

## 6. DASHBOARD ✅

### ✅ Datos Implementados

1. ✅ Saldo total (por moneda)
2. ✅ Balance de todas las cuentas
3. ✅ Últimas transacciones por producto
4. ✅ Resúmenes de tarjetas de crédito
5. ✅ Detalles de cada producto
6. ❌ Gráficos de gastos por categoría (pendiente)
7. ❌ Comparativas mes a mes (pendiente)

---

## 7. FUTURO (post-MVP) - Roadmap

### ❌ Fase 2: Automatización (Pendiente)

- ❌ Notificaciones de vencimientos
- ❌ Sugerencias de promociones
- ❌ Consejos de ahorro
- ❌ Limitación de gastos según metas

### ❌ Fase 3: Metas y Planificación (Pendiente)

- ❌ Definición de metas de ahorro
- ❌ Seguimiento de progreso
- ❌ Presupuestos por categoría
- ❌ Alertas de sobre-gasto

### ❌ Fase 4: Características Avanzadas (Pendiente)

- ❌ Inversiones
- ❌ Seguros
- ❌ Recordatorios de bonificaciones
- ❌ Gráficos avanzados
- ❌ Exportación de datos
- ❌ Reportes personalizados

---

## 8. TECH STACK Y ARQUITECTURA ✅

### ✅ Stack Implementado

**Frontend:**

- ✅ Next.js 15 (App Router)
- ✅ React 18
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Sistema de diseño OKLCH
- ✅ 3 temas (Light, Dark, Blue-Sober)

**Backend:**

- ✅ Next.js Server Actions
- ✅ Prisma ORM
- ✅ PostgreSQL

**Componentes UI:**

- ✅ Button, Input, Select, Modal
- ✅ ThemeProvider, ThemeSwitcher
- ✅ Sistema de componentes reutilizables

**Estructura:**

```
✅ app/                    # Next.js App Router
✅ src/actions/           # Server Actions
✅ src/components/        # Componentes React
✅ src/types/            # TypeScript types
✅ prisma/               # Database schema
✅ docs/                 # Documentación
```

---

## 9. RESUMEN DE ESTADO

### ✅ Completado (MVP)

- ✅ Gestión completa de cuentas y productos
- ✅ Sistema de transacciones (ingresos/egresos)
- ✅ Categorización manual
- ✅ Resúmenes de tarjetas de crédito
- ✅ Multi-moneda con conversión
- ✅ Sistema de temas
- ✅ UI moderna y responsive
- ✅ CRUD completo de todas las entidades

### ❌ Pendiente (Post-MVP)

- ❌ Metas de ahorro
- ❌ Transferencias entre cuentas
- ❌ Gráficos avanzados
- ❌ Inversiones y seguros

---

## 10. PRÓXIMOS PASOS SUGERIDOS

### Prioridad Alta

1. ❌ Implementar transferencias entre cuentas
2. ❌ Agregar gráficos de gastos por categoría
3. ❌ Dashboard con métricas del mes

### Prioridad Media

4. ❌ Sistema de metas de ahorro
5. ❌ Presupuestos por categoría
6. ❌ Exportación de datos (CSV/Excel)

### Prioridad Baja

7. ❌ Sistema de exportación masiva
8. ❌ Soporte para adjuntar archivos a transacciones
9. ❌ Herramientas de planificación avanzada

---

**Última actualización:** 2026-01-03  
**Estado:** MVP Completado ✅ | Listo para Fase 2 🚧
