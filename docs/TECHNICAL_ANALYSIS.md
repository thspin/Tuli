# Tuli v1 - Análisis Técnico Completo

**Fecha de Análisis:** 2026-01-14  
**Versión:** 0.1.0  
**Estado:** Fase 2 (80% completada)

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Modelo de Base de Datos](#modelo-de-base-de-datos)
5. [Estructura de Directorios](#estructura-de-directorios)
6. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
7. [Sistema de Diseño](#sistema-de-diseño)
8. [Flujos de Datos](#flujos-de-datos)
9. [Componentes Clave](#componentes-clave)
10. [Parsers de PDF](#parsers-de-pdf)
11. [Alcance y Limitaciones](#alcance-y-limitaciones)
12. [Notas de Implementación](#notas-de-implementación)

---

## 1. Resumen Ejecutivo

**Tuli v1** es una aplicación web moderna de gestión financiera personal diseñada para trackear cuentas, transacciones, resúmenes de tarjetas de crédito y servicios recurrentes. El proyecto implementa un sistema complejo de multi-moneda, reconciliación de estados de cuenta bancarios mediante parsing de PDFs, y un robusto sistema de diseño personalizado ("Sistema Tuli").

### Objetivo Principal
Crear una plataforma integral de tracking financiero que permita a los usuarios:
- Gestionar múltiples cuentas e instituciones financieras
- Registrar y categorizar transacciones (ingresos/egresos/transferencias)
- Automatizar la importación de resúmenes de tarjetas desde PDFs
- Visualizar balances por moneda (ARS, USD, USDT, USDC, BTC)
- Planificar pagos y vencimientos

### Estado Actual
- **Fase 1 (Completada):** Sistema base de cuentas, productos y transacciones
- **Fase 2 (80%):** Resúmenes, multi-moneda, UI moderna, calendarios
- **Fase 3 (Planificada):** Metas de ahorro, gráficos avanzados, exportación

---

## 2. Stack Tecnológico

### 2.1 Framework y Core

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 16.1.1 | Framework principal (App Router) |
| **React** | 19.2.3 | Biblioteca UI |
| **TypeScript** | 5.0+ | Lenguaje de programación |
| **Node.js** | Compatible con ES2017 | Runtime |

### 2.2 Styling y UI

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Tailwind CSS** | 3.4.17 | Sistema de utilidades CSS |
| **Inter Font** | Latest | Tipografía principal |
| **Material Symbols** | Latest | Sistema de iconos |
| **Framer Motion** | 12.23.26 | Animaciones |
| **Recharts** | 3.6.0 | Visualización de datos |

### 2.3 Backend y Base de Datos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **PostgreSQL** | - | Base de datos relacional |
| **Prisma** | 6.0.0 | ORM (Object-Relational Mapping) |
| **@prisma/adapter-pg** | 6.0.0 | Adaptador PostgreSQL |
| **Zod** | 4.1.13 | Validación de schemas |

### 2.4 Procesamiento de Archivos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **pdf-parse** | 1.1.4 | Extracción de texto de PDFs |
| **pdfjs-dist** | 5.4.530 | Parser PDF avanzado |
| **xlsx** | 0.20.2 | Manejo de Excel |

### 2.5 Utilidades

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **date-fns** | 4.1.0 | Manipulación de fechas |
| **uuid** | 13.0.0 | Generación de IDs únicos |
| **pg** | 8.16.3 | Driver PostgreSQL |

---

## 3. Arquitectura del Sistema

### 3.1 Patrón Arquitectónico

Tuli v1 implementa una **arquitectura en capas** dentro del paradigma de **Next.js App Router**:

```
┌─────────────────────────────────────────────────┐
│          /app (Routing Layer)                   │
│  - page.tsx, layout.tsx, loading.tsx            │
│  - Responsabilidad: Rutas y layouts             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│      /src/components (Presentation Layer)       │
│  - /ui: Primitivos reutilizables                │
│  - /[feature]: Componentes específicos          │
│  - Responsabilidad: Renderizado y estado UI     │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│      /src/actions (Logic/Data Layer)            │
│  - Server Actions (Next.js)                     │
│  - Responsabilidad: Lógica de negocio, DB       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           /src/lib (Infrastructure)             │
│  - prisma.ts: Cliente DB singleton              │
│  - auth.ts: Autenticación (demo user)           │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         PostgreSQL Database                     │
│  - Prisma Schema (ORM)                          │
└─────────────────────────────────────────────────┘
```

### 3.2 Decisiones Arquitectónicas Clave

1. **Server Actions vs API Routes**: Se utilizan Server Actions de Next.js en lugar de rutas API tradicionales para mejor type safety y simplicidad.

2. **Prisma ORM**: Proporciona type safety completo desde la base de datos hasta el cliente.

3. **Single User (Demo Mode)**: Actualmente usa un usuario demo hardcodeado. La autenticación real está pendiente.

4. **Client-Side State Management**: No se usa Redux/Zustand. El estado se maneja con React hooks y Server Actions con optimistic updates.

5. **Tailwind Config Centralizado**: Todo el sistema de diseño vive en `tailwind.config.ts` y variables CSS en `globals.css`.

---

## 4. Modelo de Base de Datos

### 4.1 Diagrama Entidad-Relación (Conceptual)

```
User (demo@financetracker.com)
  │
  ├─→ FinancialInstitution (Bancos, Billeteras)
  │     └─→ FinancialProduct (Tarjetas, Cuentas, Préstamos)
  │           ├─→ CreditCardSummary (Resúmenes mensuales)
  │           │     ├─→ SummaryItem (Transacciones del resumen)
  │           │     └─→ SummaryAdjustment (Ajustes: intereses, etc.)
  │           └─→ Transaction (fromProduct/toProduct)
  │
  ├─→ Category (Categorías de gasto/ingreso)
  │     └─→ Transaction
  │
  ├─→ Service (Servicios recurrentes)
  │     ├─→ ServiceBill (Facturas mensuales)
  │     └─→ ServicePaymentRule (Reglas de pago)
  │
  ├─→ Debt (Deudas - DEPRECATED, ahora son Products)
  │
  └─→ Note (Notas y recordatorios)
```

### 4.2 Modelos Principales

#### User
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String?
  createdAt    DateTime  @default(now())
  
  // Relaciones
  categories   Category[]
  summaries    CreditCardSummary[]
  institutions FinancialInstitution[]
  products     FinancialProduct[]
  services     Service[]
  transactions Transaction[]
  notes        Note[]
}
```

#### FinancialInstitution
```prisma
model FinancialInstitution {
  id           String          @id @default(uuid())
  name         String
  type         InstitutionType // BANK | WALLET
  shareSummary Boolean         @default(false)
  userId       String
  
  // Relaciones
  user         User            @relation(...)
  products     FinancialProduct[]
  summaries    CreditCardSummary[]
  notes        Note[]
  
  @@unique([userId, name])
}
```

#### FinancialProduct
Tipos: `CASH`, `SAVINGS_ACCOUNT`, `CHECKING_ACCOUNT`, `DEBIT_CARD`, `CREDIT_CARD`, `LOAN`

```prisma
model FinancialProduct {
  id                 String       @id @default(uuid())
  name               String
  type               ProductType
  currency           Currency     @default(ARS)
  balance            Decimal      @default(0.0)
  
  // Específico para tarjetas de crédito
  closingDay         Int?
  dueDay             Int?
  limit              Decimal?
  limitSinglePayment Decimal?
  limitInstallments  Decimal?
  sharedLimit        Boolean      @default(false)
  unifiedLimit       Boolean      @default(false)
  lastFourDigits     String?
  expirationDate     DateTime?
  provider           CardProvider? // VISA | MASTERCARD | AMEX
  
  // Relaciones
  institutionId      String?
  linkedProductId    String?      // Para tarjetas con cuenta vinculada
  userId             String
  
  summaries          CreditCardSummary[]
  transactionsOrigin Transaction[] @relation("FromProduct")
  transactionsDest   Transaction[] @relation("ToProduct")
  
  @@unique([institutionId, name, currency, userId])
  @@index([userId, type])  // Performance: Filtrar por usuario y tipo
  @@index([currency])       // Performance: Cálculos multi-moneda
}
```

#### Transaction
```prisma
model Transaction {
  id                String          @id @default(uuid())
  amount            Decimal
  date              DateTime
  description       String
  status            String          @default("COMPLETED")
  planZ             Boolean         @default(false) // Plan Z (financiación)
  type              TransactionType // INCOME | EXPENSE | TRANSFER
  
  // Cuotas
  installmentNumber Int?
  installmentTotal  Int?
  installmentId     String?
  
  // Relaciones
  categoryId        String?
  userId            String
  fromProductId     String
  toProductId       String?
  
  category          Category?       @relation(...)
  fromProduct       FinancialProduct @relation("FromProduct", ...)
  toProduct         FinancialProduct? @relation("ToProduct", ...)
  summaryItems      SummaryItem[]
  serviceBill       ServiceBill?
  
  @@index([userId, date])        // Performance: Queries por usuario y rango de fechas
  @@index([fromProductId, date]) // Performance: Historial de producto
  @@index([installmentId])       // Performance: Búsqueda de cuotas relacionadas
}
```

#### CreditCardSummary
```prisma
model CreditCardSummary {
  id                   String        @id @default(uuid())
  productId            String
  year                 Int
  month                Int
  closingDate          DateTime
  dueDate              DateTime
  totalAmount          Decimal       @default(0.0)
  calculatedAmount     Decimal       @default(0.0)
  adjustmentsAmount    Decimal       @default(0.0)
  isClosed             Boolean       @default(false)
  status               SummaryStatus @default(DRAFT) // DRAFT | CLOSED | PAID
  
  // Pago
  paidDate             DateTime?
  paidFromProductId    String?
  paymentTransactionId String?       @unique
  
  // Relaciones
  product              FinancialProduct
  items                SummaryItem[]
  adjustments          SummaryAdjustment[]
  
  @@unique([institutionId, productId, year, month])
}
```

#### Category
```prisma
model Category {
  id           String       @id @default(uuid())
  name         String
  icon         String?      // Emoji
  categoryType CategoryType @default(EXPENSE) // INCOME | EXPENSE
  isSystem     Boolean      @default(false)
  userId       String
  
  transactions Transaction[]
  services     Service[]
}
```

#### Service (Servicios Recurrentes)
```prisma
model Service {
  id            String   @id @default(uuid())
  name          String
  defaultAmount Decimal?
  defaultDueDay Int?
  renewalDate   DateTime?
  renewalNote   String?
  active        Boolean  @default(true)
  categoryId    String
  userId        String
  
  bills         ServiceBill[]
  paymentRules  ServicePaymentRule[]
}
```

#### Note
```prisma
model Note {
  id            String    @id @default(uuid())
  title         String
  content       String?
  color         String    @default("yellow")
  deadline      DateTime?
  isRecurring   Boolean   @default(false)
  isCompleted   Boolean   @default(false)
  userId        String
  institutionId String?
  
  @@index([userId])
}
```

### 4.3 Enums Importantes

```prisma
enum ProductType {
  CASH
  SAVINGS_ACCOUNT
  CHECKING_ACCOUNT
  DEBIT_CARD
  CREDIT_CARD
  LOAN
}

enum Currency {
  ARS
  USD
  USDT
  USDC
  BTC
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

enum SummaryStatus {
  DRAFT    // Borrador, generado automáticamente
  CLOSED   // Cerrado, listo para pagar
  PAID     // Pagado
}

enum CardProvider {
  VISA
  MASTERCARD
  AMEX
  OTHER
}
```

---

## 5. Estructura de Directorios

```
tuli-v1/
├── .next/                    # Build de Next.js (generado)
├── app/                      # Next.js App Router (Rutas)
│   ├── accounts/            # Página de cuentas
│   │   ├── [id]/            # Detalle de producto
│   │   │   ├── page.tsx
│   │   │   └── TransactionList.tsx
│   │   └── page.tsx
│   ├── analytics/           # Página de analytics
│   ├── calendar/            # Calendario financiero
│   ├── notes/               # Notas y recordatorios
│   ├── services/            # Servicios recurrentes
│   ├── transactions/        # Lista de transacciones
│   ├── globals.css          # Estilos globales + variables CSS
│   ├── layout.tsx           # Layout raíz
│   ├── loading.tsx          # Loading state global
│   └── page.tsx             # Dashboard (home)
│
├── src/
│   ├── actions/             # Server Actions (Lógica de negocio)
│   │   ├── accounts/
│   │   │   ├── account-actions.ts        # CRUD instituciones/productos
│   │   │   ├── income-actions.ts         # Ingresos simples
│   │   │   └── income-by-credit-actions.ts # Adelantos en efectivo
│   │   ├── analytics/
│   │   │   └── analytics-actions.ts      # Métricas y estadísticas
│   │   ├── calendar/
│   │   │   └── calendar-actions.ts
│   │   ├── categories/
│   │   │   └── category-actions.ts       # CRUD categorías
│   │   ├── services/
│   │   │   └── service-actions.ts        # Servicios recurrentes
│   │   ├── summaries/
│   │   │   ├── pdf-import-actions.ts     # Importar PDFs
│   │   │   └── summary-actions.ts        # CRUD resúmenes
│   │   ├── transactions/
│   │   │   ├── import-actions.ts         # Importar transacciones
│   │   │   ├── transaction-actions.ts    # CRUD transacciones
│   │   │   └── transfer-actions.ts       # Transferencias
│   │   └── notes.ts                      # CRUD notas
│   │
│   ├── components/          # Componentes React
│   │   ├── ui/              # Componentes primitivos (Design System)
│   │   │   ├── Alert.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── MoneyInput.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ClientProviders.tsx
│   │   ├── accounts/        # Componentes de cuentas
│   │   │   ├── AccountsClient.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetailsPanel.tsx
│   │   │   ├── AddInstitutionButton.tsx
│   │   │   ├── AddProductButton.tsx
│   │   │   ├── AddIncomeButton.tsx
│   │   │   ├── AddTransferButton.tsx
│   │   │   ├── UploadStatementModal.tsx
│   │   │   ├── CreditCardStack.tsx
│   │   │   └── summaries/   # Resúmenes de tarjetas
│   │   ├── calendar/
│   │   ├── categories/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── SlimSidebar.tsx
│   │   │   └── TopHeader.tsx
│   │   ├── notes/
│   │   ├── services/
│   │   └── transactions/
│   │
│   ├── lib/                 # Configuraciones core
│   │   ├── prisma.ts        # Cliente Prisma singleton
│   │   └── auth.ts          # Autenticación (demo user)
│   │
│   ├── types/               # Definiciones TypeScript
│   │   ├── index.ts         # Barrel export
│   │   ├── category.types.ts
│   │   ├── note.types.ts
│   │   ├── pdf-types.ts     # Tipos para parseo de PDFs
│   │   ├── product.types.ts
│   │   ├── summary.types.ts
│   │   └── transaction.types.ts
│   │
│   └── utils/               # Utilidades y helpers
│       ├── date.ts          # Manipulación de fechas
│       ├── exchangeRate.ts  # Conversión de monedas
│       ├── pdf-parser.ts    # Parser base de PDFs
│       ├── pdf-parsers/     # Parsers específicos por banco
│       │   ├── index.ts
│       │   ├── galicia-parser.ts
│       │   ├── nacion-parser.ts
│       │   ├── naranja-parser.ts
│       │   └── rioja-parser.ts
│       ├── serializers.ts   # Serialización de datos
│       ├── service-icons.ts # Iconos de servicios
│       └── validations.ts   # Schemas de Zod
│
├── docs/                    # Documentación
│   ├── external/            
│   ├── guides/
│   │   ├── common-use-cases.md
│   │   └── troubleshooting.md
│   ├── internal/
│   │   ├── architecture.md
│   │   ├── components.md
│   │   ├── conventions.md
│   │   ├── setup.md
│   │   └── tech-stack.md
│   ├── ingreso-por-credito.md
│   └── money-input.md
│
├── prisma/
│   └── schema.prisma        # Schema de base de datos
│
├── public/                  # Assets estáticos
│
├── .env                     # Variables de entorno (gitignored)
├── .gitignore
├── AGENTS.md                # Índice para AI agents
├── CLAUDE.md                # Guía para Claude AI
├── DESIGN_SYSTEM.md         # Sistema de diseño completo
├── PROD.md                  # Product Requirements Document
├── next.config.ts           # Configuración Next.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts       # Configuración Tailwind (Sistema Tuli)
└── tsconfig.json
```

---

## 6. Módulos y Funcionalidades

### 6.1 Gestión de Cuentas (Accounts)

**Archivo:** `src/actions/accounts/account-actions.ts`

#### Funcionalidades:
1. **CRUD Instituciones Financieras**
   - `createInstitution(formData)`: Crear banco/billetera
   - `updateInstitution(id, formData)`: Editar institución
   - `deleteInstitution(id)`: Eliminar institución (cascade a productos)

2. **CRUD Productos Financieros**
   - `createProduct(formData)`: Crear tarjeta, cuenta, préstamo, efectivo
   - `updateProduct(id, formData)`: Editar producto
   - `deleteProduct(id)`: Eliminar producto
   
3. **Obtención de Datos**
   - `getAccountsPageData()`: Obtiene todas instituciones con productos
   - `getProductDetails(productId)`: Detalles de un producto específico

#### Lógica Especial:
- **Efectivo (CASH)**: No requiere institución (`institutionId = null`)
- **Tarjetas vinculadas**: `linkedProductId` permite vincular tarjeta de crédito con cuenta bancaria
- **Límites compartidos**: `sharedLimit` indica si varias tarjetas comparten el mismo límite
- **Conversión de moneda**: Automática al calcular balances totales

### 6.2 Transacciones (Transactions)

**Archivos:**
- `src/actions/transactions/transaction-actions.ts`
- `src/actions/accounts/income-actions.ts`
- `src/actions/transactions/transfer-actions.ts`
- `src/actions/accounts/income-by-credit-actions.ts`

#### Tipos de Transacciones:

1. **Egresos (EXPENSE)**
   - Gastos en tarjetas de crédito
   - Débitos en cuentas
   - Soporte para cuotas (installments)
   - Flag `planZ` para financiación especial

2. **Ingresos (INCOME)**
   - Ingresos simples: `createIncome()`
   - Ingresos por crédito: `createIncomeByCredit()` 
     - Crea 3 transacciones atómicamente:
       1. Ingreso en cuenta destino
       2. Cargo en tarjeta de crédito
       3. Comisión (categoría "Intereses")

3. **Transferencias (TRANSFER)**
   - Entre productos del usuario
   - Conversión automática si las monedas difieren
   - Actualiza balances de ambos productos

#### Cuotas (Installments):
```typescript
// Estructura de cuota
{
  installmentNumber: 1,      // Cuota actual (1-based)
  installmentTotal: 6,       // Total de cuotas
  installmentId: "uuid",     // ID compartido por todas las cuotas
  planZ: false              // Si es Plan Z (0% interés)
}
```

**Generación de cuotas futuras:**
- Cuando se crea una compra en cuotas, se generan todas las transacciones futuras
- Cada cuota tiene su propia fecha (mensual)
- Se asocian automáticamente a los resúmenes correspondientes

### 6.3 Resúmenes de Tarjetas (Credit Card Summaries)

**Archivos:**
- `src/actions/summaries/summary-actions.ts`
- `src/actions/summaries/pdf-import-actions.ts`

#### Ciclo de Vida de un Resumen:

1. **Generación Automática** (`generateSummary`)
   - Se ejecuta al cargar la página de detalles de producto
   - Busca transacciones del mes para esa tarjeta
   - Crea `SummaryItem` para cada transacción

2. **Estados:**
   - `DRAFT`: Auto-generado, puede modificarse
   - `CLOSED`: Cerrado manualmente, listo para pagar
   - `PAID`: Pagado, inmutable

3. **Cálculos:**
   ```typescript
   calculatedAmount = sum(summaryItems.amount)
   adjustmentsAmount = sum(adjustments.amount)
   totalAmount = calculatedAmount + adjustmentsAmount
   ```

4. **Ajustes (SummaryAdjustment):**
   - `COMMISSION`: Comisiones bancarias
   - `TAX`: Impuestos
   - `INTEREST`: Intereses por financiación
   - `INSURANCE`: Seguros
   - `CREDIT`: Créditos/devoluciones
   - `OTHER`: Otros

5. **Pago de Resumen:**
   - Crea una transferencia desde una cuenta
   - Marca el resumen como `PAID`
   - Genera recibo de pago

### 6.4 Importación de PDFs

**Archivo:** `src/actions/summaries/pdf-import-actions.ts`

#### Proceso de Importación:

```
1. parsePDFStatementAction(file)  [⏱️ ~2-5s para PDF de 10 páginas]
   ├─ Extrae texto del PDF (pdf-parse o pdfjs-dist)
   ├─ Detecta institución (Galicia, Nación, Naranja, Rioja)
   └─ Ejecuta parser específico → ParsedStatement

2. reconcileStatementAction(statement, productId)  [⏱️ ~1-3s para 50 transacciones]
   ├─ Compara transacciones del PDF con BD
   ├─ Fuzzy matching (descripción + fecha + monto)
   ├─ Marca coincidencias, duplicados, nuevas
   └─ ReconciliationResult

3. applyStatementImportAction(reconciliation, confirmedItems)  [⏱️ <1s]
   ├─ Crea transacciones nuevas aprobadas por usuario
   ├─ Actualiza resumen (totalAmount, adjustments)
   ├─ Marca items como reconciliados
   └─ ImportResult
```

**Nota de Performance:** El parsing completo puede tomar 3-10 segundos dependiendo del tamaño del PDF y la cantidad de transacciones. Se recomienda mostrar indicadores de progreso al usuario.

#### Parsers Soportados:

**1. Banco Galicia** (`galicia-parser.ts`)
- Detecta: "BANCO GALICIA", "TARJETA GALICIA"
- Soporta: VISA, Mastercard, Amex
- Extrae: Cierre, vencimiento, transacciones, intereses

**2. Banco Nación** (`nacion-parser.ts`)
- Detecta: "BANCO DE LA NACION ARGENTINA"
- Soporta: VISA
- Extrae: Detalle similar a Galicia

**3. Tarjeta Naranja** (`naranja-parser.ts`)
- Detecta: "TARJETA NARANJA", "NARANJA X"
- Formato específico de Naranja
- Maneja múltiples productos (Naranja, Naranja X, Visa Naranja)

**4. Banco Rioja** (`rioja-parser.ts`)
- Detecta: "BANCO RIOJA", "NUEVO BANCO DE LA RIOJA"
- Soporta: VISA, Mastercard

#### Fuzzy Matching Algorithm:
```typescript
// src/utils/pdf-parser.ts
stringSimilarity(str1, str2): number // 0-100
  - Normaliza strings (lowercase, sin acentos)
  - Calcula similitud de Levenshtein adaptada
  - Threshold: 70% para considerar match
```

### 6.5 Servicios Recurrentes

**Archivo:** `src/actions/services/service-actions.ts`

#### Estructura:
- **Service**: Definición del servicio (Netflix, Spotify, etc.)
- **ServiceBill**: Facturas mensuales generadas
- **ServicePaymentRule**: Reglas de descuento/cashback por tarjeta

#### Estados de Factura:
- `PENDING`: Pendiente de pago
- `PAID`: Pagada (vinculada a transacción)
- `SKIPPED`: Omitida (no se pagó ese mes)

#### Lógica de Generación:
- Se generan facturas automáticamente cada mes
- Si existe un `defaultDueDay`, usa ese día
- Puede vincularse con transacción al marcar como pagada

### 6.6 Categorías

**Archivo:** `src/actions/categories/category-actions.ts`

#### Tipos:
- **INCOME**: Categorías de ingresos
- **EXPENSE**: Categorías de gastos

#### Categorías del Sistema:
```typescript
isSystem: true  // No se pueden editar ni eliminar
```

Ejemplos de categorías del sistema:
- "Ingreso por crédito"
- "Intereses"
- "Transferencia"

### 6.7 Notas (Notes)

**Archivo:** `src/actions/notes.ts`

#### Características:
- Título y contenido
- Colores personalizables
- Deadlines (fechas límite)
- Recurrentes (se repiten)
- Estado completado/pendiente
- Pueden asociarse a instituciones financieras

### 6.8 Analytics

**Archivo:** `src/actions/analytics/analytics-actions.ts`

#### Métricas:
- Balance total por moneda
- Gastos por categoría
- Ingresos vs egresos
- Deudas pendientes
- Próximos vencimientos

### 6.9 Calendario Financiero

**Archivo:** `src/actions/calendar/calendar-actions.ts`

#### Eventos:
- Vencimientos de resúmenes
- Fechas de cierre de tarjetas
- Vencimientos de servicios
- Deadlines de notas
- Visualización mensual

---

## 7. Sistema de Diseño ("Sistema Tuli")

### 7.1 Filosofía

El "Sistema Tuli" es un lenguaje de diseño personalizado que extiende Tailwind CSS con tokens semánticos específicos para aplicaciones financieras modernas.

**Principios:**
1. **Premium**: Diseño que se siente de alta calidad
2. **Consistente**: Mismo espaciado, radios y sombras en toda la app
3. **Accesible**: WCAG AA compliant
4. **Performante**: Animaciones a 60fps

### 7.2 Tokens de Diseño

#### Colores (CSS Variables en `globals.css`)

```css
:root {
  /* Primarios */
  --primary: 59 130 246;        /* Blue 500 */
  --primary-foreground: 255 255 255;
  
  /* Semánticos */
  --success: 34 197 94;         /* Green 500 */
  --destructive: 239 68 68;      /* Red 500 */
  --warning: 245 158 11;         /* Amber 500 */
  --info: 59 130 246;            /* Blue 400 */
  
  /* Neutrales */
  --background: 248 250 252;     /* Slate 50 */
  --foreground: 15 23 42;        /* Slate 900 */
  --card: 255 255 255;
  --border: 230 232 236;
}
```

#### Border Radius (Sistema Tuli)

```typescript
// tailwind.config.ts
borderRadius: {
  'tuli-xs': '12px',   // Chips, badges
  'tuli-sm': '16px',   // Inputs, botones
  'tuli-md': '20px',   // Cards pequeñas
  'tuli-lg': '24px',   // Cards estándar ← DEFAULT
  'tuli-xl': '32px',   // Contenedores principales
  'tuli-2xl': '40px',  // Modales
  'tuli-full': '9999px' // Pills, avatares
}
```

**Regla:** Usar siempre `rounded-tuli-*` en lugar de `rounded-*`

#### Sombras (Elevación)

```typescript
boxShadow: {
  'tuli-sm': '0 2px 8px -2px rgb(100 116 139 / 0.1)',
  'tuli-md': '0 4px 16px -4px rgb(100 116 139 / 0.15)', // ← DEFAULT
  'tuli-lg': '0 8px 24px -6px rgb(100 116 139 / 0.2)',
  'tuli-xl': '0 20px 40px -12px rgb(100 116 139 / 0.25)',
  'tuli-2xl': '0 24px 48px -12px rgb(100 116 139 / 0.3)',
  
  // Sombras de color
  'tuli-primary': '0 8px 24px -6px var(--primary)',
  'tuli-inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
}
```

#### Espaciado (Sistema 8px)

```typescript
spacing: {
  'page': '2rem',       // 32px - Padding de página móvil
  'page-md': '3rem',    // 48px - Padding de página desktop
  'card': '1.5rem',     // 24px - Padding interno de cards ← DEFAULT
  'card-lg': '2rem',    // 32px - Cards grandes
  'section': '4rem',    // 64px - Entre secciones
  'section-lg': '6rem'  // 96px - Entre secciones grandes
}
```

#### Tipografía

```typescript
fontSize: {
  'display': ['3.5rem', { lineHeight: '1', fontWeight: '900' }],
  'balance': ['3rem', { lineHeight: '1', fontWeight: '900' }],
  'label': ['0.6875rem', { letterSpacing: '0.2em', fontWeight: '900' }]
}
```

**Fuente:** Inter (desde Google Fonts)

#### Animaciones

```typescript
animation: {
  'fade-in': 'fadeIn 300ms ease-in-out',
  'slide-up': 'slideUp 300ms ease-out',
  'slide-down': 'slideDown 300ms ease-out',
  'scale-in': 'scaleIn 200ms ease-out',
  'shimmer': 'shimmer 2s linear infinite'
}

transitionDuration: {
  'instant': '100ms',  // Checkbox, toggle
  'fast': '200ms',     // Hover, focus
  'base': '300ms',     // ← DEFAULT
  'slow': '500ms'      // Modales, complejas
}
```

#### Z-Index (Capas)

```typescript
zIndex: {
  'dropdown': '1000',
  'sticky': '1020',
  'modal-backdrop': '1040',
  'modal': '1050',
  'popover': '1060',
  'tooltip': '1070'
}
```

### 7.3 Componentes UI Base

#### Button (`src/components/ui/Button.tsx`)

**Variantes:**
- `primary`: Acción principal (máximo 1 por pantalla)
- `secondary`: Acciones secundarias
- `ghost`: Acciones terciarias
- `danger`: Acciones destructivas

**Tamaños:**
- `sm`: 36px altura mínima
- `md`: 44px altura mínima ← DEFAULT
- `lg`: 52px altura mínima

**Estados:** hover, focus, active, disabled

#### Card (`src/components/ui/Card.tsx`)

**Variantes:**
- Flat: Con borde, sin sombra
- Elevated: Con sombra (default)
- Interactive: Hover + cursor pointer

**Estructura:**
```tsx
<Card>
  <CardHeader /> {/* Opcional */}
  <CardContent />
  <CardFooter />  {/* Opcional */}
</Card>
```

#### Modal (`src/components/ui/Modal.tsx`)

**Características:**
- Backdrop con blur
- Animación scale-in
- Cierre con Escape
- Lock de scroll en body
- Trap de foco (accesibilidad)

#### Input (`src/components/ui/Input.tsx`)

**Estados:**
- Default
- Focus (ring de 4px)
- Error (borde rojo)
- Disabled (opacity 50%)

**Especial:** `MoneyInput.tsx` para entrada de montos con formateo automático

### 7.4 Accesibilidad

#### Contraste:
- Texto normal: Mínimo 4.5:1 (WCAG AA)
- Texto grande: Mínimo 3:1
- Componentes UI: Mínimo 3:1

#### Navegación:
- Tab order lógico
- Focus visible en todos los elementos interactivos
- Soporte para escape en modales
- ARIA labels en iconos sin texto

#### Reducir Movimiento:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Flujos de Datos

### 8.1 Flujo de Creación de Transacción

```
1. Usuario llena formulario
   ├─ Componente: AddIncomeButton.tsx o similar
   └─ Validación client-side (Zod)

2. Submit del formulario
   ├─ useTransition() para optimistic UI
   └─ Llama Server Action

3. Server Action (transaction-actions.ts)
   ├─ Valida con Zod schema
   ├─ Obtiene usuario demo
   ├─ Si es cuota: genera todas las transacciones futuras
   └─ Crea transacción(es) en Prisma

4. Actualiza balance del producto
   ├─ Decrementa/incrementa según tipo
   └─ Maneja conversión si es multi-moneda

5. Asocia a resumen (si es tarjeta de crédito)
   ├─ Busca o crea resumen del mes
   └─ Crea SummaryItem

6. Revalidación
   ├─ revalidatePath('/accounts')
   ├─ revalidatePath(`/accounts/${productId}`)
   └─ Cliente re-fetches automáticamente

7. UI actualizada
   └─ Usuario ve nueva transacción
```

### 8.2 Flujo de Importación de PDF

```
1. Usuario selecciona PDF
   ├─ Componente: UploadStatementModal.tsx
   └─ Selecciona institución y producto

2. parsePDFStatementAction()
   ├─ Lee ArrayBuffer del archivo
   ├─ Extrae texto (pdf-parse o pdfjs-dist)
   ├─ Detecta banco (regex patterns)
   ├─ Ejecuta parser específico
   │   ├─ galicia-parser.ts
   │   ├─ nacion-parser.ts
   │   ├─ naranja-parser.ts
   │   └─ rioja-parser.ts
   └─ Retorna ParsedStatement

3. reconcileStatementAction()
   ├─ Busca transacciones existentes en BD
   ├─ Para cada tx del PDF:
   │   ├─ Fuzzy match con transacciones BD
   │   │   ├─ Descripción (70% similitud)
   │   │   ├─ Fecha (±1 día)
   │   │   └─ Monto (centavos exactos)
   │   └─ Clasifica: EXACT | SIMILAR | NEW | DUPLICATE
   └─ Retorna ReconciliationResult

4. Usuario revisa reconciliación
   ├─ Acepta matches automáticos
   ├─ Rechaza duplicados
   └─ Confirma creación de nuevas

5. applyStatementImportAction()
   ├─ Crea transacciones nuevas aprobadas
   ├─ Vincula transacciones existentes al resumen
   ├─ Crea ajustes (intereses, comisiones)
   ├─ Actualiza totalAmount del resumen
   └─ Marca items como reconciliados

6. Resumen completo
   └─ Usuario puede cerrar y pagar
```

### 8.3 Flujo de Pago de Resumen

```
1. Usuario abre resumen CLOSED
   ├─ Componente: SummaryDetailModal.tsx
   └─ Ve totalAmount calculado

2. Click "Pagar Resumen"
   ├─ Modal de confirmación
   └─ Selecciona cuenta de pago

3. paySummaryAction()
   ├─ Valida que resumen esté CLOSED
   ├─ Valida saldo suficiente en cuenta
   ├─ Crea transacción de pago (TRANSFER)
   │   ├─ Desde: cuenta seleccionada
   │   ├─ Hacia: tarjeta de crédito
   │   └─ Monto: totalAmount
   ├─ Actualiza balance de ambos productos
   ├─ Marca resumen como PAID
   └─ Guarda paymentTransactionId

4. Genera recibo de pago
   └─ PaymentReceipt { date, amount, fromProduct, summary }

5. Revalidación
   └─ UI muestra resumen pagado
```

---

## 9. Componentes Clave

### 9.1 AccountsClient.tsx

**Propósito:** Componente cliente principal de la página de cuentas.

**Props:**
```typescript
{
  institutions: InstitutionWithProducts[]
  cashProducts: ProductWithInstitution[]
  usdToArsRate: number
}
```

**Características:**
- Muestra carrusel de instituciones
- Tarjetas de productos apiladas (CreditCardStack)
- Balance total multi-moneda
- Modales de creación/edición
- Estado local para instituciones seleccionadas

### 9.2 ProductDetailsPanel.tsx

**Propósito:** Panel lateral con detalles de un producto financiero.

**Funcionalidades:**
- Lista de transacciones del producto
- Filtros por fecha y categoría
- Resúmenes de tarjetas de crédito
- Botones de acción (editar, eliminar, transferir)
- Próximo resumen projected

### 9.3 UploadStatementModal.tsx

**Propósito:** Modal complejo para importar PDFs.

**Estados:**
1. Upload: Seleccionar archivo
2. Parsing: Extrayendo datos
3. Reconciliation: Revisar matches
4. Confirmation: Aplicar cambios
5. Success: Importación completada

**Validaciones:**
- Solo archivos PDF
- Máximo 10MB
- Institución debe coincidir
- Producto debe ser tarjeta de crédito

### 9.4 AddIncomeButton.tsx

**Propósito:** Modal para crear ingresos (simples o por crédito).

**Lógica Especial:**
- Detecta categoría "Ingreso por crédito"
- Muestra campos adicionales:
  - Tarjeta origen (solo MercadoPago, Astropay)
  - Campo de comisión
- Llama a `createIncomeByCredit()` que crea 3 transacciones

### 9.5 CreditCardStack.tsx

**Propósito:** Visualización apilada de tarjetas de crédito.

**Características:**
- Diseño visual de tarjetas físicas
- Logos de proveedores (VISA, Mastercard, Amex)
- Últimos 4 dígitos
- Balance y límite
- Hover para expandir

### 9.6 MoneyInput.tsx

**Propósito:** Input especializado para entrada de montos.

**Características:**
- Formateo automático argentino (1.234,56)
- Separador de miles
- Solo números y coma
- Parsing a Decimal para BD

---

## 10. Parsers de PDF

### 10.1 Arquitectura de Parsers

Cada parser implementa la interfaz:

```typescript
function parseXXXStatement(text: string): ParsedStatement {
  return {
    institution: 'GALICIA' | 'NACION' | 'NARANJA' | 'RIOJA',
    cardType: 'VISA' | 'MASTERCARD' | 'AMEX',
    lastFourDigits: string,
    closingDate: Date,
    dueDate: Date,
    totalAmount: number,
    previousBalance: number,
    payments: number,
    newCharges: number,
    transactions: ParsedTransaction[],
    adjustments: ParsedAdjustment[]
  }
}
```

### 10.2 Galicia Parser (`galicia-parser.ts`)

**Detecta:**
- "BANCO GALICIA"
- "TARJETA GALICIA"
- "GALICIA MOVE"

**Extracción:**
```typescript
// Fechas
CIERRE ACTUAL: 31 Dic 25
VENCIMIENTO: 09 Ene 26

// Transacciones
20.12.25  MERCADOPAGO*NETFLIX      1.234,56
15.12.25  MP*SPOTIFY CUOTA 02/06     500,00

// Ajustes
INTERESES FINANCIACION: 123,45
COMISION MANTENIMIENTO: 250,00
```

**Características:**
- Detecta cuotas con formato "CUOTA XX/YY"
- Maneja intereses como ajustes
- Soporta 3 tipos de tarjetas (VISA, MC, Amex)

### 10.3 Nación Parser (`nacion-parser.ts`)

**Similar a Galicia, con variaciones:**
- Formato de fecha: DD/MM/YYYY
- Sección "DETALLE DE MOVIMIENTOS"
- Intereses separados

### 10.4 Naranja Parser (`naranja-parser.ts`)

**Características únicas:**
- Múltiples productos en un PDF
- "NARANJA", "NARANJA X", "VISA NARANJA"
- Formato complejo de cuotas
- Maneja "Plan Z" (financiación 0%)

**Detección de Plan Z:**
```typescript
if (description.includes('PLAN Z')) {
  planZ = true;
}
```

### 10.5 Rioja Parser (`rioja-parser.ts`)

**Detecta:**
- "BANCO RIOJA"
- "NUEVO BANCO DE LA RIOJA"

**Formato similar a Nación**

---

## 11. Alcance y Limitaciones

### 11.1 Funcionalidades Implementadas ✅

#### Fase 1 (100%)
- ✅ Gestión de instituciones financieras
- ✅ Gestión de productos (tarjetas, cuentas, efectivo)
- ✅ Transacciones (ingresos/egresos)
- ✅ Categorías personalizables
- ✅ Sistema de cuotas
- ✅ Multi-moneda (ARS, USD, USDT, USDC, BTC)

#### Fase 2 (80%)
- ✅ Resúmenes de tarjetas automáticos
- ✅ Importación de PDFs (4 bancos)
- ✅ Reconciliación de transacciones
- ✅ Sistema de diseño "Tuli"
- ✅ Conversión de monedas
- ✅ Notas y recordatorios
- ✅ Calendario financiero básico
- ⏳ Servicios recurrentes (en progreso)

### 11.2 Pendiente (Fase 3) ❌

- ❌ Gráficos de gastos por categoría
- ❌ Metas de ahorro
- ❌ Presupuestos por categoría
- ❌ Exportación de datos (CSV/Excel)
- ❌ Reportes personalizados
- ❌ Inversiones
- ❌ Seguros
- ❌ Autenticación real (actualmente demo user)
- ❌ Multi-usuario

### 11.3 Limitaciones Conocidas

#### Autenticación
- **Actual:** Usuario demo hardcodeado (`demo@financetracker.com`)
- **Limitación:** No hay autenticación real, JWT, sesiones
- **Impacto:** No se puede usar en producción multi-usuario

#### Parsers de PDF
- **Soportados:** Solo 4 bancos argentinos
- **Limitación:** PDFs de otros bancos no se pueden importar
- **Workaround:** Entrada manual de transacciones

#### Conversión de Monedas
- **Actual:** Tipo de cambio manual/estático
- **Limitación:** No actualización automática de tasas
- **Impacto:** Valores pueden quedar desactualizados

**Recomendación de Mejora:**
Integrar API de tipos de cambio para actualización automática:
- **Para Argentina:** [dolarapi.com](https://dolarapi.com) - API gratuita con cotizaciones de dólar blue, oficial, MEP
- **Alternativas Globales:**
  - [exchangerate-api.com](https://www.exchangerate-api.com/) - 1500 requests/mes gratis
  - [fixer.io](https://fixer.io/) - API de divisas Forex
  - [openexchangerates.org](https://openexchangerates.org/) - 1000 requests/mes gratis

**Implementación Sugerida:**
```typescript
// src/utils/exchangeRate.ts
export async function fetchLatestRates(): Promise<ExchangeRate[]> {
  const response = await fetch('https://dolarapi.com/v1/dolares');
  const data = await response.json();
  // Guardar en BD como ExchangeRate con timestamp
}

// Ejecutar daily via cron job o Next.js cron API
```

#### Performance
- **Transacciones:** Sin paginación en listas grandes
- **Limitación:** Puede degradarse con >1000 transacciones
- **Mitigación:** Filtros por fecha implementados

#### Base de Datos
- **Migrations:** Directorio `prisma/migrations/` en gitignore
- **Limitación:** Sin historial de migraciones versionado
- **Riesgo:** Dificulta deploys en equipo

### 11.4 Deuda Técnica

1. **Error Handling**
   - Muchos Server Actions retornan `{ success, error }` genérico
   - Falta tipado exhaustivo de errores

2. **Testing**
   - ❌ Sin tests unitarios
   - ❌ Sin tests de integración
   - ❌ Sin tests E2E

3. **Logging y Monitoring**
   - Console.log en desarrollo
   - Sin logging estructurado
   - Sin monitoring de errores (Sentry, etc.)

4. **Optimización**
   - Sin lazy loading de componentes pesados
   - Sin image optimization (Next/Image)
   - Sin code splitting manual

5. **Documentación**
   - Muchos componentes sin JSDoc
   - Falta documentación de APIs internas

---

## 12. Notas de Implementación

### 12.1 Patrones de Código

#### Server Actions Pattern
```typescript
'use server'

export async function actionName(formData: FormData) {
  try {
    // 1. Validación con Zod
    const data = schema.parse(Object.fromEntries(formData));
    
    // 2. Obtener usuario
    const user = await getDemoUser();
    
    // 3. Lógica de negocio
    const result = await prisma.model.create({ data: { ...data, userId: user.id } });
    
    // 4. Revalidación
    revalidatePath('/path');
    
    // 5. Retorno
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### Component Pattern
```typescript
'use client'

export default function Component({ serverData }) {
  const [isPending, startTransition] = useTransition();
  const [localState, setLocalState] = useState(serverData);
  
  const handleAction = async (formData: FormData) => {
    startTransition(async () => {
      const result = await serverAction(formData);
      if (result.success) {
        setLocalState(result.data); // Optimistic update
      } else {
        alert(result.error);
      }
    });
  };
  
  return (
    <form action={handleAction}>
      {/* Form fields */}
    </form>
  );
}
```

### 12.2 Convenciones de Nombres

#### Archivos
- **Componentes:** PascalCase.tsx (`ProductCard.tsx`)
- **Actions:** kebab-case.ts (`account-actions.ts`)
- **Utils:** kebab-case.ts (`pdf-parser.ts`)
- **Types:** kebab-case.types.ts (`product.types.ts`)

#### Variables
- **Componentes:** PascalCase (`ProductCard`)
- **Funciones:** camelCase (`createProduct`)
- **Constantes:** UPPER_SNAKE_CASE (`PRODUCT_TYPE_ICONS`)
- **Interfaces/Types:** PascalCase (`ProductWithInstitution`)

#### Base de Datos
- **Tablas:** PascalCase singular (`User`, `Transaction`)
- **Campos:** camelCase (`createdAt`, `userId`)
- **Enums:** PascalCase (`ProductType`, `Currency`)

### 12.3 Gestión de Estado

**Client State:**
- React hooks (`useState`, `useReducer`)
- Sin librería externa (no Redux, Zustand)

**Server State:**
- Server Actions + `useTransition`
- Revalidación automática con `revalidatePath`
- Optimistic updates manuales

**Form State:**
- FormData nativo de HTML
- No react-hook-form (por simplicidad)

### 12.4 Seguridad

#### SQL Injection
- ✅ Protegido: Prisma usa prepared statements

#### XSS
- ✅ Protegido: React escapa strings por defecto
- ⚠️ Riesgo: `dangerouslySetInnerHTML` no usado

#### CSRF
- ✅ Protegido: Server Actions usan tokens automáticos

#### Autenticación
- ❌ No implementada: Usuario demo sin password

### 12.5 Variables de Entorno

**Archivo:** `.env` (gitignored)

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
DIRECT_URL="postgresql://user:pass@host:5432/dbname"  
# (usado por Prisma en serverless)

# Environment mode
NODE_ENV="development" | "production"

# Client-side variables (opcional)
# NEXT_PUBLIC_API_URL="http://localhost:3000"
# NEXT_PUBLIC_ANALYTICS_ID="..."
```

**Nota:** Existe un archivo `.env.example` en la raíz del proyecto con valores de plantilla para facilitar el setup inicial. Copiar este archivo a `.env` y completar con valores reales.

**Regla NEXT_PUBLIC_*:** Variables con prefijo `NEXT_PUBLIC_` son accesibles en el cliente. Nunca exponer secrets (API keys, DB credentials) con este prefijo.

### 12.6 Scripts npm

```json
{
  "dev": "next dev",                    // Servidor desarrollo
  "build": "next build",                // Build producción
  "start": "next start",                 // Servidor producción
  "lint": "next lint",                   // ESLint
  "prisma:studio": "prisma studio",      // GUI de BD
  "migrate:dev": "prisma migrate dev",   // Crear migración
  "migrate:deploy": "prisma migrate deploy", // Aplicar en prod
  "migrate:status": "prisma migrate status"  // Ver estado
}
```

### 12.7 Deployment

**Plataforma Recomendada:** Vercel (integración nativa con Next.js)

**Pasos:**
1. Conectar repo de GitHub
2. Configurar `DATABASE_URL` en variables de entorno
3. Build automático en cada push a `main`
4. Ejecutar `prisma migrate deploy` en build
5. Deploy

**Alternativas:**
- Railway
- Render
- AWS Amplify
- Docker + cualquier cloud

### 12.8 Consideraciones de BD

#### Connection Pooling
```typescript
// src/lib/prisma.ts
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
```

**Propósito:** Reutilizar conexiones en serverless

#### Singleton Pattern
```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Propósito:** Evitar múltiples instancias en hot reload

---

## 13. Conclusión

Tuli v1 es un proyecto robusto y bien estructurado que implementa un sistema completo de gestión financiera personal. El uso de Next.js 15 con App Router, Prisma, y un sistema de diseño personalizado demuestra un alto nivel de madurez técnica.

### Fortalezas Principales

1. **Arquitectura Clara:** Separación de capas bien definida
2. **Type Safety:** TypeScript + Prisma end-to-end
3. **Diseño Premium:** Sistema Tuli consistente y profesional
4. **Funcionalidad Única:** Parsers de PDF para bancos argentinos
5. **Multi-Moneda:** Soporte completo para 5 monedas
6. **Resúmenes Automáticos:** Generación y reconciliación inteligente

### Áreas de Mejora

1. **Testing:** Implementar suite completa de tests
2. **Autenticación:** Sistema de usuarios real
3. **Performance:** Paginación y lazy loading
4. **Monitoring:** Logging estructurado y error tracking
5. **Documentación:** JSDoc en componentes complejos

### Próximos Pasos Recomendados

**Corto Plazo (1-2 meses):**
1. Completar módulo de servicios recurrentes
2. Implementar gráficos de gastos por categoría
3. Agregar transferencias entre cuentas

**Mediano Plazo (3-6 meses):**
4. Sistema de autenticación (NextAuth.js)
5. Metas de ahorro y presupuestos
6. Exportación de datos (CSV/Excel)

**Largo Plazo (6+ meses):**
7. Multi-tenant (varios usuarios)
8. App móvil (React Native)
9. Integración con APIs bancarias reales (Open Banking)

---

**Última Actualización:** 2026-01-14  
**Autor del Análisis:** Antigravity AI Agent  
**Versión del Documento:** 1.0
