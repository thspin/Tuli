# UI Component Catalog

## 🧩 Core Components (`src/components/ui`)

### Button
Standard interactive element with predefined "Tuli System" styles.

**Path**: `src/components/ui/Button.tsx`

**Props**:
- `variant`: `'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline'` (Default: `primary`)
- `size`: `'sm' | 'md' | 'lg'` (Default: `md`)
- `fullWidth`: `boolean` (Default: `false`)
- `loading`: `boolean` - Shows spinner.
- `icon`: `React.ReactNode` - Left-side icon.

**Usage**:
```tsx
import Button from "@/components/ui/Button";

<Button 
  variant="primary" 
  size="lg" 
  onClick={handleSubmit} 
  loading={isPending}
>
  Save Changes
</Button>
```

### Card
Base container with standard shadow and border radius.

**Path**: `src/components/ui/Card.tsx`

**Usage**:
```tsx
import Card from "@/components/ui/Card";

<Card className="p-card">
  <h2>Account Summary</h2>
  {/* content */}
</Card>
```

### LoadingSpinner
Visual indicator for async states.

**Path**: `src/components/ui/LoadingSpinner.tsx`

---

## 🏗️ Feature Components
*Browse `src/components/[feature]` for domain-specific UI.*

- **Accounts**: `src/components/accounts` (Lists, Cards, Forms)
- **Transactions**: `src/components/transactions`
- **Dashboard**: `src/components/dashboard`
