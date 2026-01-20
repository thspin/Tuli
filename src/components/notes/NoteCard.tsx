'use client'

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Note } from "@/src/types/note.types";
import { useState } from "react";
import { updateNote, deleteNote } from "@/src/actions/notes";

interface NoteCardProps {
    note: Note;
    onEdit: (note: Note) => void;
}

// Glass-themed color map with translucent backgrounds
const colorMap: Record<string, string> = {
    yellow: "bg-amber-500/20 border-amber-400/30 text-amber-100",
    blue: "bg-blue-500/20 border-blue-400/30 text-blue-100",
    red: "bg-red-500/20 border-red-400/30 text-red-100",
    green: "bg-emerald-500/20 border-emerald-400/30 text-emerald-100",
    purple: "bg-purple-500/20 border-purple-400/30 text-purple-100",
};

// Glow colors for the tape effect
const glowMap: Record<string, string> = {
    yellow: "bg-amber-400/40",
    blue: "bg-blue-400/40",
    red: "bg-red-400/40",
    green: "bg-emerald-400/40",
    purple: "bg-purple-400/40",
};

export default function NoteCard({ note, onEdit }: NoteCardProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading) return;
        if (!window.confirm("¿Seguro que deseas eliminar esta nota?")) return;
        setLoading(true);
        await deleteNote(note.id);
        setLoading(false);
    };

    const handleToggleComplete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        await updateNote(note.id, { isCompleted: !note.isCompleted });
        setLoading(false);
    };

    const colorClasses = colorMap[note.color] || colorMap.yellow;
    const glowClass = glowMap[note.color] || glowMap.yellow;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, rotate: 1 }}
            className={`
                group relative p-5 min-h-[200px] flex flex-col justify-between rounded-2xl border
                backdrop-blur-md shadow-lg transition-all cursor-pointer
                ${colorClasses}
                ${note.isCompleted ? 'opacity-60 grayscale-[0.3]' : ''}
                font-sans overflow-hidden
            `}
            onClick={() => onEdit(note)}
        >
            {/* Tape Effect - Glass styled */}
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-5 ${glowClass} backdrop-blur-sm rotate-2 shadow-lg rounded-sm z-10`}></div>

            {/* Main Content Area */}
            <div className="flex-1">
                {/* Header: Title + Checkbox */}
                <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className={`font-bold text-lg leading-tight ${note.isCompleted ? 'line-through decoration-2 opacity-50' : 'opacity-90'}`}>
                        {note.title}
                    </h3>

                    <button
                        onClick={handleToggleComplete}
                        className={`
                            flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                            ${note.isCompleted
                                ? 'bg-white/30 border-transparent'
                                : 'border-white/30 hover:border-white/60 bg-transparent'
                            }
                        `}
                        title={note.isCompleted ? "Marcar como pendiente" : "Completar"}
                    >
                        {note.isCompleted && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                    </button>
                </div>

                {/* Body Content */}
                <div className="text-sm font-medium whitespace-pre-wrap opacity-80 leading-relaxed mb-6">
                    {note.content}
                </div>
            </div>

            {/* Footer Area */}
            <div className="flex items-end justify-between pt-4 border-t border-white/10 mt-auto">
                <div className="flex flex-col gap-2">
                    {/* Institution Tag */}
                    {note.institution && (
                        <div className="inline-flex">
                            <span className="bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/60 truncate max-w-[120px]">
                                {note.institution.name}
                            </span>
                        </div>
                    )}

                    {/* Date & Recurrence */}
                    <div className="flex items-center gap-2 text-xs font-semibold opacity-70 min-h-[20px]">
                        {note.deadline ? (
                            <span className={`flex items-center gap-1.5 ${new Date(note.deadline) < new Date() && !note.isCompleted ? 'text-red-300 font-bold bg-red-500/20 px-1.5 py-0.5 rounded' : ''}`}>
                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                {format(new Date(note.deadline), "d 'de' MMMM", { locale: es })}
                            </span>
                        ) : (
                            <span className="text-white/30 italic text-[11px]">Sin fecha</span>
                        )}

                        {note.isRecurring && (
                            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-white/70" title="Recurrente mensual">
                                <span className="material-symbols-outlined text-[14px]">update</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={handleDelete}
                    className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-300 text-current opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all transform hover:scale-110"
                    title="Eliminar nota"
                >
                    <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                </button>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-20 rounded-2xl">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin opacity-70"></div>
                </div>
            )}
        </motion.div>
    );
}
