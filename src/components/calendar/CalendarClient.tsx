'use client'

import React, { useState, useEffect } from 'react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isPast,
    startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getCalendarEvents, CalendarEvent } from '@/src/actions/calendar/calendar-actions';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import SummaryDetailModal from '@/src/components/accounts/summaries/SummaryDetailModal';
import { getSummaryDetails, generateSummary, updateSummaryDates } from '@/src/actions/summaries/summary-actions';
import { updateBill } from '@/src/actions/services/service-actions';
import { updateNote } from '@/src/actions/notes';
import { serializeSummary } from '@/src/utils/serializers';

export default function CalendarClient() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSummary, setSelectedSummary] = useState<any>(null);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
    const [dragOverDay, setDragOverDay] = useState<string | null>(null);

    const fetchEvents = async () => {
        setLoading(true);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        console.log(`[CalendarUI] Fetching events for ${month}/${year}`);
        const res = await getCalendarEvents(month, year);
        console.log('[CalendarUI] Response:', res);
        if (res.success && res.events) {
            console.log(`[CalendarUI] Received ${res.events.length} events`);
            setEvents(res.events);
        } else {
            console.log('[CalendarUI] No events or error:', res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const days = React.useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        return eachDayOfInterval({
            start: startDate,
            end: endDate
        });
    }, [currentDate]);

    const weekDays = ['Don', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const eventsByDate = React.useMemo(() => {
        const groups: Record<string, CalendarEvent[]> = {};
        events.forEach(event => {
            const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(event);
        });
        return groups;
    }, [events]);

    const getDayEvents = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return eventsByDate[dateKey] || [];
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const handleEventClick = async (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        if (event.type === 'CARD_CLOSING' || event.type === 'CARD_DUE') {
            setLoading(true);
            let summaryId = event.metadata?.summaryId as string;

            // If it's an estimated event, generate the summary first
            if (!summaryId && event.metadata?.productId && event.metadata?.month && event.metadata?.year) {
                const genRes = await generateSummary(
                    event.metadata.productId as string,
                    event.metadata.year as number,
                    event.metadata.month as number
                );
                if (genRes.success && genRes.summary) {
                    summaryId = genRes.summary.id;
                }
            }

            if (summaryId) {
                const res = await getSummaryDetails(summaryId);
                if (res.success && res.summary) {
                    setSelectedSummary(res.summary);
                    setIsSummaryModalOpen(true);
                }
            }
            setLoading(false);
        }
    };

    const handleDragStart = (event: CalendarEvent) => {
        setDraggedEvent(event);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (day: Date) => {
        setDragOverDay(day.toISOString());
    };

    const handleDragLeave = () => {
        setDragOverDay(null);
    };

    const handleDrop = async (targetDate: Date) => {
        if (!draggedEvent) return;

        const event = draggedEvent;
        const previousEvents = [...events];
        const targetDateIso = targetDate.toISOString();

        // Actualización Optimista Local
        setEvents(prev => prev.map(e =>
            e.id === event.id ? { ...e, date: targetDateIso } : e
        ));

        setDraggedEvent(null);
        setDragOverDay(null);

        // Only move BILL, CLOSING, DUE
        if (event.type === 'CARD_EXPIRATION') return;

        try {
            const dateStr = format(targetDate, 'yyyy-MM-dd');

            if (event.type === 'BILL') {
                const billId = event.metadata?.billId as string;
                if (billId) {
                    const res = await updateBill(billId, { dueDate: new Date(`${dateStr}T12:00:00`) });
                    if (!res.success) throw new Error(res.error);
                }
            } else if (event.type === 'NOTE_DEADLINE') {
                const noteId = event.metadata?.noteId as string;
                if (noteId) {
                    const res = await updateNote(noteId, { deadline: new Date(`${dateStr}T12:00:00`) });
                    if (!res.success) throw new Error(res.error);
                }
            } else if (event.type === 'CARD_CLOSING' || event.type === 'CARD_DUE') {
                let summaryId = event.metadata?.summaryId as string;

                if (!summaryId && event.metadata?.productId && event.metadata?.month && event.metadata?.year) {
                    const genRes = await generateSummary(
                        event.metadata.productId as string,
                        event.metadata.year as number,
                        event.metadata.month as number
                    );
                    if (genRes.success && genRes.summary) {
                        summaryId = genRes.summary.id;
                    }
                }

                if (summaryId) {
                    const resDetails = await getSummaryDetails(summaryId);
                    if (resDetails.success && resDetails.summary) {
                        const s = resDetails.summary;
                        const currentClosing = format(new Date(s.closingDate), 'yyyy-MM-dd');
                        const currentDue = format(new Date(s.dueDate), 'yyyy-MM-dd');

                        const updateRes = event.type === 'CARD_CLOSING'
                            ? await updateSummaryDates(summaryId, dateStr, currentDue)
                            : await updateSummaryDates(summaryId, currentClosing, dateStr);

                        if (!updateRes.success) throw new Error(updateRes.error);
                    }
                }
            }

            // Refrescar para asegurar sincronía total
            await fetchEvents();
        } catch (error) {
            console.error('Error al mover evento:', error);
            // Revertir si falla
            setEvents(previousEvents);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Tuli</span>
                            <span className="text-white/30">/</span>
                            <span className="text-blue-300 text-[10px] uppercase tracking-wider font-semibold">Calendario</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight glass-text">Calendario</h1>
                    </div>

                    <div className="flex glass-card p-1.5 items-center gap-2">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <span className="font-bold text-sm text-white capitalize px-2 min-w-[120px] text-center">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                        <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
                        <button
                            onClick={handleToday}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Hoy
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden mb-2">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                        {weekDays.map(day => (
                            <div key={day} className="py-4 text-center text-xs font-bold text-white/50 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Scrollable Area */}
                    <div className="grid grid-cols-7 auto-rows-fr bg-white/5 gap-px flex-1 overflow-y-auto custom-scrollbar">
                        {days.map((day: Date, idx: number) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isTodayDate = isToday(day);
                            const isPastDay = isPast(startOfDay(day)) && !isTodayDate;
                            const dayEvents = getDayEvents(day);

                            // Ordenar eventos: Vencimientos primero, Facturas, Expiración, Cierres (más discretos al final)
                            dayEvents.sort((a, b) => {
                                const typePriority: Record<string, number> = { 'CARD_DUE': 1, 'BILL': 2, 'NOTE_DEADLINE': 3, 'CARD_EXPIRATION': 4, 'CARD_CLOSING': 5 };
                                return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
                            });

                            return (
                                <div
                                    key={day.toISOString()}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(day)}
                                    onDragEnter={() => handleDragEnter(day)}
                                    onDragLeave={handleDragLeave}
                                    className={`
                                        min-h-[120px] md:min-h-[140px] p-2 relative group transition-colors cursor-default
                                        ${!isCurrentMonth ? 'bg-white/5' : isPastDay ? 'bg-white/10' : 'bg-white/15'}
                                        ${dragOverDay === day.toISOString() ? 'bg-blue-500/20 ring-2 ring-blue-400/30 ring-inset' : 'hover:bg-white/20'}
                                    `}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                                            ${isTodayDate
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                                                : isCurrentMonth ? 'text-white/80' : 'text-white/30'}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {/* Optional: Add indicators for mobile if too crowded */}
                                    </div>

                                    <div className="space-y-1 overflow-hidden flex-1">
                                        {/* Show only first 2 events in the cell */}
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div
                                                key={event.id}
                                                draggable={event.type !== 'CARD_EXPIRATION'}
                                                onDragStart={() => handleDragStart(event)}
                                                onClick={(e) => handleEventClick(event, e)}
                                                className={`
                                                    px-2 py-1 rounded-md text-[10px] font-bold border truncate shadow-sm transition-all hover:scale-[1.02] cursor-pointer
                                                    ${draggedEvent?.id === event.id ? 'opacity-40 scale-95' : 'opacity-100'}
                                                    ${event.type === 'BILL' ? 'bg-blue-200 text-blue-900 border-blue-400' :
                                                        event.type === 'CARD_CLOSING' ? 'bg-slate-200 text-slate-700 border-slate-400 border-dashed opacity-90' :
                                                            event.type === 'CARD_DUE' ? 'bg-red-200 text-red-900 border-red-400 font-extrabold' :
                                                                event.type === 'NOTE_DEADLINE' ? 'bg-[#fffbd5] text-amber-900 border-[#fbf6c1]' :
                                                                    event.type === 'CARD_EXPIRATION' ? 'bg-violet-200 text-violet-900 border-violet-400' : ''}
                                                `}
                                                title={`${event.title}${event.amount ? ` - $${event.amount}` : ''}`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.type === 'BILL' ? 'bg-blue-700' :
                                                        event.type === 'CARD_CLOSING' ? 'bg-slate-600' :
                                                            event.type === 'CARD_DUE' ? 'bg-red-700' :
                                                                event.type === 'NOTE_DEADLINE' ? 'bg-amber-400' :
                                                                    event.type === 'CARD_EXPIRATION' ? 'bg-violet-700' : 'bg-slate-500'
                                                        }`}></div>
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Show "+X more" indicator if there are more than 2 events */}
                                        {dayEvents.length > 2 && (
                                            <div
                                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDate(day);
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[12px]">more_horiz</span>
                                                +{dayEvents.length - 2} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {loading && (
                    <div className="fixed bottom-6 right-6 bg-white p-3 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-[60]">
                        <LoadingSpinner size="sm" />
                        <span className="text-xs font-medium text-slate-500 pr-2">Actualizando...</span>
                    </div>
                )}

                {/* Day Events Modal */}
                {selectedDate && (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedDate(null)}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isToday(selectedDate)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {format(selectedDate, 'd')}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 capitalize">
                                            {format(selectedDate, 'EEEE', { locale: es })}
                                        </h3>
                                        <p className="text-sm text-slate-500 capitalize">
                                            {format(selectedDate, 'MMMM yyyy', { locale: es })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Events List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {(() => {
                                    const dayEvents = getDayEvents(selectedDate);
                                    dayEvents.sort((a, b) => {
                                        const typePriority: Record<string, number> = { 'CARD_DUE': 1, 'BILL': 2, 'CARD_EXPIRATION': 3, 'CARD_CLOSING': 4 };
                                        return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
                                    });

                                    if (dayEvents.length === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                                                <p className="text-slate-500">No hay eventos para este día</p>
                                            </div>
                                        );
                                    }

                                    return dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                handleEventClick(event, e);
                                                setSelectedDate(null);
                                            }}
                                            className={`
                                                p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md
                                                ${event.type === 'BILL' ? 'bg-blue-200 border-blue-400 hover:border-blue-500' :
                                                    event.type === 'CARD_CLOSING' ? 'bg-slate-200 border-slate-400 border-dashed hover:border-slate-500' :
                                                        event.type === 'CARD_DUE' ? 'bg-red-200 border-red-400 hover:border-red-500 shadow-sm' :
                                                            event.type === 'NOTE_DEADLINE' ? 'bg-[#fffbd5] border-[#fbf6c1] hover:border-amber-300' :
                                                                event.type === 'CARD_EXPIRATION' ? 'bg-violet-200 border-violet-400 hover:border-violet-500' : 'bg-slate-200 border-slate-400'}
                                            `}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${event.type === 'BILL' ? 'bg-blue-300' :
                                                        event.type === 'CARD_CLOSING' ? 'bg-slate-300' :
                                                            event.type === 'CARD_DUE' ? 'bg-red-300' :
                                                                event.type === 'NOTE_DEADLINE' ? 'bg-amber-100' :
                                                                    event.type === 'SERVICE_PROMO_END' ? 'bg-pink-100' :
                                                                        event.type === 'CARD_EXPIRATION' ? 'bg-violet-300' : 'bg-slate-300'
                                                        }`}>
                                                        <span className={`material-symbols-outlined text-xl ${event.type === 'BILL' ? 'text-blue-700' :
                                                            event.type === 'CARD_CLOSING' ? 'text-slate-500' :
                                                                event.type === 'CARD_DUE' ? 'text-red-700' :
                                                                    event.type === 'NOTE_DEADLINE' ? 'text-amber-700' :
                                                                        event.type === 'SERVICE_PROMO_END' ? 'text-pink-700' :
                                                                            event.type === 'CARD_EXPIRATION' ? 'text-violet-700' : 'text-slate-600'
                                                            }`}>
                                                            {event.type === 'BILL' ? 'receipt_long' :
                                                                event.type === 'CARD_CLOSING' ? 'event' :
                                                                    event.type === 'CARD_DUE' ? 'payments' :
                                                                        event.type === 'NOTE_DEADLINE' ? 'sticky_note_2' :
                                                                            event.type === 'SERVICE_PROMO_END' ? 'verified' :
                                                                                event.type === 'CARD_EXPIRATION' ? 'credit_card_off' : 'event'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`font-bold text-sm ${event.type === 'BILL' ? 'text-blue-800' :
                                                            event.type === 'CARD_CLOSING' ? 'text-slate-600 font-medium' :
                                                                event.type === 'CARD_DUE' ? 'text-red-800 font-extrabold' :
                                                                    event.type === 'NOTE_DEADLINE' ? 'text-amber-900 font-bold' :
                                                                        event.type === 'SERVICE_PROMO_END' ? 'text-pink-900 font-bold' :
                                                                            event.type === 'CARD_EXPIRATION' ? 'text-violet-800' : 'text-slate-800'
                                                            }`}>
                                                            {event.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {event.type === 'BILL' ? 'Factura' :
                                                                event.type === 'CARD_CLOSING' ? 'Cierre de Tarjeta' :
                                                                    event.type === 'CARD_DUE' ? 'Vencimiento' :
                                                                        event.type === 'NOTE_DEADLINE' ? 'Deadline' :
                                                                            event.type === 'SERVICE_PROMO_END' ? 'Fin de Promo' :
                                                                                event.type === 'CARD_EXPIRATION' ? 'Vence Plástico' : 'Evento'}
                                                            {!!event.metadata?.institutionName && ` • ${String(event.metadata.institutionName)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {event.amount !== undefined && event.amount > 0 && (
                                                    <div className={`text-right flex-shrink-0 ${event.type === 'BILL' ? 'text-blue-700' :
                                                        event.type === 'CARD_CLOSING' ? 'text-slate-500' :
                                                            event.type === 'CARD_DUE' ? 'text-red-700' :
                                                                event.type === 'NOTE_DEADLINE' ? 'hidden' :
                                                                    event.type === 'CARD_EXPIRATION' ? 'text-violet-700' : 'text-slate-700'
                                                        }`}>
                                                        <p className="font-bold text-sm">
                                                            ${event.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedSummary && (
                    <SummaryDetailModal
                        summary={selectedSummary}
                        isOpen={isSummaryModalOpen}
                        onClose={() => {
                            setIsSummaryModalOpen(false);
                            // Optionally clear summary after animation
                            setTimeout(() => setSelectedSummary(null), 300);
                        }}
                        onRefresh={async () => {
                            const result = await getSummaryDetails(selectedSummary.id);
                            if (result.success && result.summary) {
                                setSelectedSummary(result.summary);
                            }
                            fetchEvents();
                        }}
                    />
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
