'use client'

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Note } from "@/src/types/note.types";
import { useState } from "react";
import { updateNote, deleteNote } from "@/src/actions/notes";

interface CompletedNoteRowProps {
    note: Note;
    onEdit: (note: Note) => void;
}

// Glass-themed color map for completed notes
const colorMap: Record<string, string> = {
    yellow: "bg-amber-500/10 border-amber-400/20",
    blue: "bg-blue-500/10 border-blue-400/20",
    red: "bg-red-500/10 border-red-400/20",
    green: "bg-emerald-500/10 border-emerald-400/20",
    purple: "bg-purple-500/10 border-purple-400/20",
};

export default function CompletedNoteRow({ note, onEdit }: CompletedNoteRowProps) {
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

    return (
        <div
            className={`
                group relative flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm transition-all
                ${colorMap[note.color] || colorMap.yellow}
                hover:bg-white/10 cursor-pointer
            `}
            onClick={() => onEdit(note)}
        >
            {/* Checkbox */}
            <button
                onClick={handleToggleComplete}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-white/30 border-2 border-white/30 flex items-center justify-center transition-all hover:bg-white/40 hover:border-white/50"
                title="Marcar como pendiente"
            >
                <span className="material-symbols-outlined text-white text-xs font-bold">check</span>
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-white/60 line-through decoration-2">
                        {note.title}
                    </h4>

                    {note.institution && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/10 px-2 py-0.5 rounded-lg">
                            {note.institution.name}
                        </span>
                    )}
                </div>

                {note.deadline && (
                    <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        <span>{format(new Date(note.deadline), "d 'de' MMMM", { locale: es })}</span>
                        {note.isRecurring && (
                            <span className="material-symbols-outlined text-[14px] ml-1" title="Recurrente">update</span>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(note);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
                    title="Editar nota"
                >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-all"
                    title="Eliminar nota"
                >
                    <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                </button>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
}
