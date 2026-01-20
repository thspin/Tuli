'use client'

import { useState, useEffect } from "react";
import { Note } from "@/src/types/note.types";
import { createNote, updateNote, getInstitutions } from "@/src/actions/notes";
import { format } from "date-fns";
import LoadingSpinner from "../ui/LoadingSpinner";

interface NoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    note?: Note | null;
}

// Glass-themed colors for notes
const colors = [
    { id: 'yellow', bg: 'bg-amber-500/20', border: 'border-amber-400/30', ring: 'ring-amber-400/50', preview: 'bg-amber-400' },
    { id: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-400/30', ring: 'ring-blue-400/50', preview: 'bg-blue-400' },
    { id: 'red', bg: 'bg-red-500/20', border: 'border-red-400/30', ring: 'ring-red-400/50', preview: 'bg-red-400' },
    { id: 'green', bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', ring: 'ring-emerald-400/50', preview: 'bg-emerald-400' },
    { id: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-400/30', ring: 'ring-purple-400/50', preview: 'bg-purple-400' },
];

export default function NoteFormModal({ isOpen, onClose, note }: NoteFormModalProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [color, setColor] = useState("yellow");
    const [deadline, setDeadline] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    const [institutionId, setInstitutionId] = useState("");
    const [institutions, setInstitutions] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingInst, setFetchingInst] = useState(false);

    useEffect(() => {
        const fetchInst = async () => {
            setFetchingInst(true);
            const res = await getInstitutions();
            if (res.success) {
                setInstitutions(res.institutions || []);
            }
            setFetchingInst(false);
        };
        fetchInst();
    }, []);

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content || "");
            setColor(note.color);
            setDeadline(note.deadline ? format(new Date(note.deadline), 'yyyy-MM-dd') : "");
            setIsRecurring(note.isRecurring || false);
            setInstitutionId(note.institutionId || "");
        } else {
            setTitle("");
            setContent("");
            setColor("yellow");
            setDeadline("");
            setIsRecurring(false);
            setInstitutionId("");
        }
    }, [note, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            title,
            content,
            color,
            deadline: deadline ? new Date(`${deadline}T12:00:00`) : null,
            isRecurring,
            institutionId: institutionId || null
        };

        if (note) {
            await updateNote(note.id, payload);
        } else {
            await createNote(payload);
        }

        setLoading(false);
        onClose();
    };

    const selectedColor = colors.find(c => c.id === color) || colors[0];

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className={`
                    w-full max-w-md glass-card-elevated overflow-hidden transition-all duration-300
                    ${selectedColor.bg} ${selectedColor.border}
                `}
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/80">
                                    {note ? 'edit_note' : 'add_notes'}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white glass-text">
                                    {note ? 'Editar Nota' : 'Nueva Nota'}
                                </h2>
                                <p className="text-xs text-white/50">
                                    {note ? 'Modifica tu recordatorio' : 'Crea un nuevo recordatorio'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">

                        <div>
                            <input
                                type="text"
                                placeholder="Título (ej. Pagar Internet)"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                className="w-full bg-transparent border-0 text-2xl font-bold text-white placeholder:text-white/30 focus:ring-0 px-0 py-1 outline-none"
                                autoFocus
                            />
                        </div>

                        <div>
                            <textarea
                                placeholder="Detalles, montos, recordatorios..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full glass-input min-h-[120px] text-white placeholder:text-white/30 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Color</label>
                                <div className="flex gap-2">
                                    {colors.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setColor(c.id)}
                                            className={`
                                                w-8 h-8 rounded-full transition-all
                                                ${c.preview}
                                                ${color === c.id
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110 shadow-lg'
                                                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                                                }
                                            `}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Deadline (Opcional)</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="w-full glass-input text-white text-sm py-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Institution */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Institución (Tag)</label>
                                <div className="relative">
                                    <select
                                        value={institutionId}
                                        onChange={e => setInstitutionId(e.target.value)}
                                        className="w-full glass-input text-white text-sm py-2 appearance-none pr-10"
                                    >
                                        <option value="" className="bg-slate-800">Ninguna</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id} className="bg-slate-800">{inst.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {fetchingInst ? <LoadingSpinner size="sm" color="white" /> : <span className="material-symbols-outlined text-sm text-white/40">expand_more</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Recurrence */}
                            <div className="space-y-2 flex flex-col justify-end pb-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`
                                        w-5 h-5 rounded-lg border flex items-center justify-center transition-all
                                        ${isRecurring
                                            ? 'bg-white/20 border-white/40 text-white'
                                            : 'border-white/20 group-hover:border-white/40 bg-transparent'
                                        }
                                    `}>
                                        {isRecurring && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={e => setIsRecurring(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium text-white/60 group-hover:text-white/80 select-none">
                                        Repetir cada mes
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 bg-white/5 border-t border-white/10 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <LoadingSpinner size="sm" color="white" />
                                    Guardando...
                                </span>
                            ) : 'Guardar Nota'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
