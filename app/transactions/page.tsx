import { getAccountsPageData } from '@/src/actions/accounts/account-actions';
import { getTransactions } from '@/src/actions/transactions/transaction-actions';
import TransactionsClient from '@/src/components/transactions/TransactionsClient';

export default async function TransactionsPage() {
    const data = await getAccountsPageData();
    const transactionsResult = await getTransactions();

    return (
        <TransactionsClient
            institutions={data.institutions}
            cashProducts={data.cashProducts}
            initialTransactions={transactionsResult.transactions}
        />
    );
}
