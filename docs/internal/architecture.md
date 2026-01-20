# Project Architecture

## 🏛️ High-Level Overview
Tuli V1 follows a **Layered Architecture** within the **Next.js App Router** framework. It strictly separates routing, UI presentation, and business logic/data access.

## 📂 Directory Structure & Responsibilities

### `/app` (Routing Layer)
- Contains valid Next.js route segments (`page.tsx`, `layout.tsx`, `loading.tsx`).
- **Responsibility**: URL handling, layouts, and initial data fetching (if server components).
- **Rule**: Keep logic minimal here. Import components from `src/components`.

### `/src/components` (Presentation Layer)
- **`/ui`**: Reusable, agnostic primitives (Design System). Examples: `Button.tsx`, `Card.tsx`.
- **`/[feature]`**: Domain-specific components. Examples: `transactions/TransactionList.tsx`, `accounts/AccountCard.tsx`.
- **Responsibility**: Rendering UI, handling client-side state/interactions.

### `/src/actions` (Logic/Data Layer)
- Contains Next.js **Server Actions**.
- **Responsibility**: Database interactions (Prisma), external API calls, business rules validation.
- **Pattern**: Functions here are called directly by Client Components or Server Components.

### `/src/lib` (Core Infrastructure)
- `prisma.ts`: Singleton Prisma Client instance.
- `auth.ts`: Authentication configuration.

### `/src/utils` (Helpers)
- `pdf-parser.ts` & `/pdf-parsers`: Specialized logic for extracting data from bank statements.
- `validations.ts`: Zod schemas and validation helpers.
- `date.ts`: Date manipulation utilities.

## 🔄 Data Flow
1. **User Interaction**: User clicks a button in a **Client Component** (`src/components/...`).
2. **Server Action**: Component calls an async function imported from `src/actions/...`.
3. **Database Access**: Server Action uses `prisma` (from `src/lib/prisma.ts`) to query Postgres.
4. **Validation**: Data is validated using Zod schemas (`src/utils/validations.ts`).
5. **Response**: Server Action returns plain data (serialized) to the component.
6. **Update**: Component updates state/UI (often using `useTransition` or optimistic updates).

## 🛠️ Key Architectural Decisions
- **Server Actions over API Routes**: We avoid `/pages/api` in favor of direct Server Actions for type safety and simplicity.
- **Prisma**: ORM of choice for type-safe database access.
- **Tailwind System**: Centralized design tokens in `tailwind.config.ts` drive the entire UI (The "Tuli System").
