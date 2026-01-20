import { getAccountsPageData } from '@/src/actions/accounts/account-actions';
import { getTransactions } from '@/src/actions/transactions/transaction-actions';
import { getCategories } from '@/src/actions/categories/category-actions';
import TransactionsClient from '@/src/components/transactions/TransactionsClient';

export default async function TransactionsPage() {
    const data = await getAccountsPageData();
    const transactionsResult = await getTransactions();
    const categoriesResult = await getCategories();

    return (
        <TransactionsClient
            institutions={data.institutions}
            cashProducts={data.cashProducts}
            initialTransactions={transactionsResult.transactions}
            categories={categoriesResult.categories || []}
        />
    );
}
