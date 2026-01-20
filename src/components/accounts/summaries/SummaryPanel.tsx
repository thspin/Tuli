'use client'

import { useState, useEffect } from 'react';
import { formatNumber } from '@/src/utils/validations';
import { getCurrentSummary, getSummaries, getSummaryDetails } from '@/src/actions/summaries/summary-actions';
import SummaryCard from './SummaryCard';
import SummaryDetailModal from './SummaryDetailModal';
import PaySummaryModal from './PaySummaryModal';

interface SummaryPanelProps {
    productId: string;
    productName: string;
    institutionId?: string | null;
    availableAccounts: {
        id: string;
        name: string;
        balance: number;
        currency: string;
        type: string;
        institutionId?: string | null;
    }[];
}

interface Summary {
    id: string;
    year: number;
    month: number;
    closingDate: Date | string;
    dueDate: Date | string;
    calculatedAmount: number;
    adjustmentsAmount: number;
    totalAmount: number;
    status: 'DRAFT' | 'CLOSED' | 'PAID';
    paidDate?: Date | string | null;
    items: any[];
    adjustments: any[];
    product?: any;
}

// Helper to normalize Prisma response to local Summary type
function normalizeSummary(data: any): Summary {
    return {
        id: data.id,
        year: data.year,
        month: data.month,
        closingDate: data.closingDate,
        dueDate: data.dueDate,
        calculatedAmount: Number(data.calculatedAmount ?? data.totalAmount ?? 0),
        adjustmentsAmount: Number(data.adjustmentsAmount ?? 0),
        totalAmount: Number(data.totalAmount ?? 0),
        status: data.status ?? 'DRAFT',
        paidDate: data.paidDate,
        items: data.items ?? [],
        adjustments: data.adjustments ?? [],
        product: data.product
    };
}

export default function SummaryPanel({ productId, productName, institutionId, availableAccounts }: SummaryPanelProps) {
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
    const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
    const [summaryForPayment, setSummaryForPayment] = useState<Summary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get current summary
            const currentResult = await getCurrentSummary(productId);
            if (currentResult.success && currentResult.summary) {
                setCurrentSummary(normalizeSummary(currentResult.summary));
            }

            // Get all summaries
            const allResult = await getSummaries(productId);
            if (allResult.success) {
                setSummaries(allResult.summaries.map(normalizeSummary));
            }
        } catch (err) {
            console.error('Error loading summaries:', err);
            setError('Error al cargar los resúmenes');
        }

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [productId]);

    const handleViewDetails = async (summaryId: string) => {
        const result = await getSummaryDetails(summaryId);
        if (result.success && result.summary) {
            setSelectedSummary(normalizeSummary(result.summary));
        }
    };

    const handlePaySummary = (summaryId: string) => {
        const summary = summaries.find(s => s.id === summaryId) || currentSummary;
        if (summary) {
            setSummaryForPayment({
                ...summary,
                product: { id: productId, name: productName, institutionId }
            });
        }
    };

    const handlePaymentSuccess = () => {
        setSummaryForPayment(null);
        setSelectedSummary(null);
        loadData();
    };

    const pendingSummaries = summaries.filter(s => s.status !== 'PAID');
    const paidSummaries = summaries.filter(s => s.status === 'PAID');

    if (isLoading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-flex items-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="text-sm">Cargando resúmenes...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-rose-500">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p className="text-sm">{error}</p>
                <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 rounded-lg bg-rose-100 text-rose-600 text-sm font-semibold hover:bg-rose-200"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current/Pending Summaries */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">pending_actions</span>
                    Resúmenes Pendientes
                </h3>

                {pendingSummaries.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingSummaries.map(summary => (
                            <SummaryCard
                                key={summary.id}
                                summary={summary}
                                productName={productName}
                                onViewDetails={handleViewDetails}
                                onPaySummary={handlePaySummary}
                            />
                        ))}
                    </div>
                ) : currentSummary ? (
                    <SummaryCard
                        summary={currentSummary}
                        productName={productName}
                        onViewDetails={handleViewDetails}
                        onPaySummary={handlePaySummary}
                    />
                ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                        <p className="text-sm font-medium">No hay resúmenes pendientes</p>
                    </div>
                )}
            </div>

            {/* Paid Summaries (History) */}
            {paidSummaries.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span className="material-symbols-outlined text-[18px] text-emerald-600">history</span>
                            Historial de Pagos ({paidSummaries.length})
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    {showHistory && (
                        <div className="mt-4 grid grid-cols-1 gap-4">
                            {paidSummaries.slice(0, 6).map(summary => (
                                <SummaryCard
                                    key={summary.id}
                                    summary={summary}
                                    productName={productName}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            {selectedSummary && (
                <SummaryDetailModal
                    summary={selectedSummary}
                    isOpen={true}
                    onClose={() => setSelectedSummary(null)}
                    onPaySummary={() => handlePaySummary(selectedSummary.id)}
                    onRefresh={async () => {
                        const result = await getSummaryDetails(selectedSummary.id);
                        if (result.success && result.summary) {
                            setSelectedSummary(normalizeSummary(result.summary));
                        }
                        loadData();
                    }}
                />
            )}

            {/* Pay Modal */}
            {summaryForPayment && (
                <PaySummaryModal
                    summary={summaryForPayment}
                    availableAccounts={availableAccounts}
                    isOpen={true}
                    onClose={() => setSummaryForPayment(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
