// app/accounts/page.tsx
import Link from 'next/link';
import { getAccountsPageData } from './actions';
import AccountsClient from './AccountsClient';

export default async function AccountsPage() {
  const data = await getAccountsPageData();

  return (
    <div>
      {/* Navegación superior */}
      <div className="max-w-6xl mx-auto p-6 pt-4">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Volver al inicio
        </Link>
      </div>

      <AccountsClient
        institutions={data.institutions}
        cashProducts={data.cashProducts}
        usdToArsRate={data.usdToArsRate}
      />
    </div>
  );
}
