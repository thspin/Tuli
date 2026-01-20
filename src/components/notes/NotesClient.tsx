'use client'

import { useState, useMemo } from "react";
import { Note } from "@/src/types/note.types";
import NoteCard from "./NoteCard";
import CompletedNoteRow from "./CompletedNoteRow";
import NoteFormModal from "./NoteFormModal";
import { AnimatePresence, motion } from "framer-motion";

type SortOption = 'deadline-asc' | 'deadline-desc' | 'newest' | 'oldest';

export default function NotesClient({ notes }: { notes: Note[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('deadline-asc');
    const [showCompleted, setShowCompleted] = useState(true);

    const handleNewNote = () => {
        setEditingNote(null);
        setIsModalOpen(true);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setIsModalOpen(true);
    };

    const { activeNotes, completedNotes } = useMemo(() => {
        const active = notes.filter(note => !note.isCompleted);
        const completed = notes.filter(note => note.isCompleted);
        return { activeNotes: active, completedNotes: completed };
    }, [notes]);

    const sortedActiveNotes = useMemo(() => {
        const notesCopy = [...activeNotes];

        switch (sortBy) {
            case 'deadline-asc':
                return notesCopy.sort((a, b) => {
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                });
            case 'deadline-desc':
                return notesCopy.sort((a, b) => {
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
                });
            case 'newest':
                return notesCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'oldest':
                return notesCopy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            default:
                return notesCopy;
        }
    }, [activeNotes, sortBy]);

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Tuli</span>
                            <span className="text-white/30">/</span>
                            <span className="text-blue-300 text-[10px] uppercase tracking-wider font-semibold">Workspace</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white glass-text tracking-tight">Notas &amp; Pendientes</h1>
                        <p className="text-white/60 mt-1">Organiza tus tareas, recordatorios y deadlines financieros.</p>
                    </div>

                    <button
                        onClick={handleNewNote}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nueva Nota
                    </button>
                </div>

                {/* Sort Controls */}
                {activeNotes.length > 0 && (
                    <div className="flex items-center gap-3">
                        <label htmlFor="sort-select" className="text-sm font-semibold text-white/60">
                            Ordenar por:
                        </label>
                        <select
                            id="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-white cursor-pointer"
                        >
                            <option value="deadline-asc" className="bg-slate-800">Fecha límite (próximas primero)</option>
                            <option value="deadline-desc" className="bg-slate-800">Fecha límite (lejanas primero)</option>
                            <option value="newest" className="bg-slate-800">Más reciente</option>
                            <option value="oldest" className="bg-slate-800">Más antigua</option>
                        </select>
                    </div>
                )}

                {/* Notes Grid */}
                {sortedActiveNotes.length === 0 ? (
                    <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-white/30">post_add</span>
                        </div>
                        <h3 className="text-xl font-bold text-white/70 glass-text">Tu tablero está vacío</h3>
                        <p className="text-white/40 max-w-xs mt-2">Agrega notas adhesivas para no olvidar tus trámites y pagos.</p>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        <AnimatePresence>
                            {sortedActiveNotes.map((note: Note) => (
                                <NoteCard key={note.id} note={note} onEdit={handleEditNote} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Completed Notes Section */}
                {completedNotes.length > 0 && (
                    <div className="mt-12 border-t border-white/10 pt-8">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-2 mb-4 text-white/60 hover:text-white transition-colors group"
                        >
                            <span
                                className="material-symbols-outlined text-lg transition-transform duration-200"
                                style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            >
                                chevron_right
                            </span>
                            <h2 className="text-lg font-bold">
                                Tareas Completadas
                            </h2>
                            <span className="text-sm font-semibold text-white/40 bg-white/10 px-2.5 py-0.5 rounded-full">
                                {completedNotes.length}
                            </span>
                        </button>

                        {showCompleted && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                            >
                                {completedNotes.map((note: Note) => (
                                    <CompletedNoteRow key={note.id} note={note} onEdit={handleEditNote} />
                                ))}
                            </motion.div>
                        )}
                    </div>
                )}

                <NoteFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    note={editingNote}
                />
            </div>
        </div>
    );
}
