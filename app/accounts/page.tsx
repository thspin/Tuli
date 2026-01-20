// app/accounts/page.tsx
import { getAccountsPageData } from '@/src/actions/accounts/account-actions';
import AccountsClient from '@/src/components/accounts/AccountsClient';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const data = await getAccountsPageData();

  return (
    <AccountsClient
      institutions={data.institutions}
      cashProducts={data.cashProducts}
      usdToArsRate={data.usdToArsRate}
    />
  );
}
