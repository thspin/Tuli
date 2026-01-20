# Coding Conventions & Standards

## 📝 Naming Conventions
- **Files**:
  - Components: `PascalCase.tsx` (e.g., `TransactionList.tsx`, `Button.tsx`).
  - Utilities/Hooks: `camelCase.ts` (e.g., `useScroll.ts`, `validateForm.ts`).
  - Server Actions: `camelCase.ts` (usually grouped by domain).
- **Component Names**: Must match filename.
- **Interfaces/Types**:
  - Prop interfaces: `[ComponentName]Props` (e.g., `ButtonProps`).
  - Domain types: PascalCase (e.g., `Transaction`, `User`).

## 💅 Styling & CSS (Tailwind)
- **Design System First**: USE the custom tokens defined in `tailwind.config.ts`.
  - usage: `rounded-tuli-lg` instead of `rounded-2xl` (unless strictly equivalent).
  - usage: `text-tuli-primary` if defined, or `text-primary`.
- **Structure**: Group related classes. Layout -> Spacing -> Typography -> Visuals.
- **No Stylesheets**: Avoid CSS modules (`.module.css`) unless absolutely necessary for complex animations not possible with Tailwind.

## 🧱 Component Structure
```tsx
import { Props } from './types' // or defined inline

interface MyComponentProps {
    title: string;
    isActive?: boolean; // Optional with ?
}

export default function MyComponent({ 
    title, 
    isActive = false // Default values in destructuring
}: MyComponentProps) {
    // 1. Hooks
    // 2. Derived state
    // 3. Render
    return (
        <div className="flex gap-4 p-tuli-md bg-white rounded-tuli-lg shadow-tuli-sm">
            <h1>{title}</h1>
        </div>
    )
}
```

## 🛠️ State Management
- **Server State**: Prioritize fetching in Server Components or using Server Actions.
- **Client State**: Use `useState` for local UI state. Use URL search params for shareable state (filters, pagination).
- **Forms**: Use uncontrolled inputs with `action` props or Controlled inputs with explicit handlers depending on complexity.

## 💾 Database & Prisma
- **No Raw SQL**: Use Prisma Client methods.
- **Single Instance**: Always import `prisma` from `src/lib/prisma`.
- **Migrations**: Always run `npx prisma migrate dev` when changing `schema.prisma`.
