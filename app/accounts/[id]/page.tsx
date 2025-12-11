
import { getProductDetails } from '@/src/actions/accounts/account-actions';
import { CARD_PROVIDER_LOGOS, CardProvider } from '@/src/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TransactionList from './TransactionList';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getProductDetails(id);

    if (!data) {
        notFound();
    }

    const { product, transactions } = data;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Navigation */}
                <div className="mb-6">
                    <Link
                        href="/accounts"
                        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm inline-flex items-center gap-2 shadow-sm border border-gray-200"
                    >
                        ← Volver a Cuentas
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                                {product.name}
                                {product.type === 'CREDIT_CARD' && (product as any).provider && CARD_PROVIDER_LOGOS[(product as any).provider as CardProvider] && (
                                    <img
                                        src={CARD_PROVIDER_LOGOS[(product as any).provider as CardProvider]}
                                        alt={(product as any).provider}
                                        className="h-6 w-auto object-contain"
                                    />
                                )}
                                {product.type === 'CREDIT_CARD' && product.lastFourDigits && (
                                    <span className="text-gray-500 font-normal text-lg">
                                        {product.lastFourDigits}
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-500">
                                {product.institution ? `${product.institution.name} • ` : ''}
                                {product.currency}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Saldo Actual</p>
                            <p className={`text-3xl font-bold ${product.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {product.currency === 'ARS' ? '$' : 'US$'} {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                            {(product.type === 'CREDIT_CARD' || product.type === 'LOAN') && product.limit && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Límite: {product.currency === 'ARS' ? '$' : 'US$'} {product.limit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transactions List Component */}
                <TransactionList
                    initialTransactions={transactions}
                    currency={product.currency}
                />
            </div>
        </div>
    );
}
