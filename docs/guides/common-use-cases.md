# Common Use Cases & Workflows

## 🛠️ Data Fetching Pattern

### Scenario: Displaying a List of Transactions
**Goal**: Fetch data from DB and show it strictly using Server Actions.

1. **Create Action**: In `src/actions/transaction.ts`
   ```typescript
   'use server'
   import { prisma } from "@/lib/prisma"
   
   export async function getRecentTransactions(userId: string) {
       return await prisma.transaction.findMany({
           where: { userId },
           orderBy: { date: 'desc' },
           take: 10
       })
   }
   ```

2. **Consume in Component**:
   ```tsx
   // src/components/transactions/RecentList.tsx
   import { getRecentTransactions } from "@/actions/transaction"
   
   // If Server Component:
   export default async function RecentList({ userId }: { userId: string }) {
       const transactions = await getRecentTransactions(userId);
       return (
           <ul>
               {transactions.map(t => <li key={t.id}>{t.amount}</li>)}
           </ul>
       )
   }
   ```

## 📝 Form Submission Pattern (Server Actions)

### Scenario: Creating a New Account
1. **Define Action**: `src/actions/accounts.ts`
   ```typescript
   'use server'
   import { revalidatePath } from "next/cache"
   
   export async function createAccount(formData: FormData) {
       const name = formData.get("name") as string
       // Validate...
       await prisma.account.create({ data: { name } })
       revalidatePath("/accounts") // Update UI
   }
   ```

2. **Form Component**:
   ```tsx
   <form action={createAccount}>
       <input name="name" />
       <Button type="submit">Create</Button>
   </form>
   ```

## 🎨 Adding New Custom Styles
Don't add arbitrary pixel values. Add a token in `tailwind.config.ts` if you need a new standard spacing or color.
- **Good**: `p-tuli-lg` (if defined)
- **Bad**: `p-[23px]`
