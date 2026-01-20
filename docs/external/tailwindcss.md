# Tailwind CSS & Tuli Design System

## 🎨 Configuration
- Custom config located at: `tailwind.config.ts`
- Extended theme with "Tuli System" variables.

## 🌈 Colors (Semantic)
Uses CSS variables defined in `global.css` (implied).
- `bg-background`, `text-foreground`
- `bg-primary`, `bg-secondary`
- `bg-card`
- **New**: `bg-row-hover`, `text-warning`

## 📐 Border Radius
- `rounded-tuli-xs`: 12px (Small buttons)
- `rounded-tuli-sm`: 16px (Inputs)
- `rounded-tuli-md`: 20px (Small Cards)
- `rounded-tuli-lg`: 24px (Standard Cards)
- `rounded-tuli-xl`: 32px (Containers)

## ✨ Shadows
- `shadow-tuli-sm`: Subtle lift.
- `shadow-tuli-primary`: Colored glow (uses primary color).
- `shadow-tuli-inner`: Inset for inputs.

## 🎬 Animations
- `animate-fade-in`
- `animate-slide-up`
- `animate-shimmer`: Loading states.

## 📝 Usage
Always use these semantic tokens instead of arbitrary values like `rounded-[15px]` or `shadow-lg`.
