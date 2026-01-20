'use server'

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotes() {
    try {
        const user = await requireUser();
        const notes = await prisma.note.findMany({
            where: { userId: user.id },
            orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
            include: {
                institution: {
                    select: { id: true, name: true }
                }
            }
        });
        return { success: true, notes };
    } catch (error) {
        console.error("Error fetching notes:", error);
        return { success: false, error: "Failed to fetch notes" };
    }
}

export async function getInstitutions() {
    try {
        const user = await requireUser();
        const institutions = await prisma.financialInstitution.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        });
        return { success: true, institutions };
    } catch (error) {
        console.error("Error fetching institutions:", error);
        return { success: false, institutions: [] };
    }
}

export async function createNote(data: { title: string; content?: string; color: string; deadline?: Date | null; isRecurring?: boolean; institutionId?: string | null }) {
    try {
        const user = await requireUser();
        const note = await prisma.note.create({
            data: {
                title: data.title,
                content: data.content,
                color: data.color,
                deadline: data.deadline,
                isRecurring: data.isRecurring || false,
                institutionId: data.institutionId,
                userId: user.id
            }
        });
        revalidatePath('/notes');
        revalidatePath('/calendar');
        return { success: true, note };
    } catch (error) {
        console.error("Error creating note:", error);
        return { success: false, error: "Failed to create note" };
    }
}

export async function updateNote(id: string, data: Partial<{ title: string; content: string; color: string; deadline: Date | null; isCompleted: boolean; isRecurring: boolean; institutionId: string | null }>) {
    try {
        const user = await requireUser();
        // Check if we are completing a recurring note
        let newNoteId: string | undefined;
        if (data.isCompleted === true) {
            const currentNote = await prisma.note.findUnique({ where: { id } });
            if (currentNote && currentNote.isRecurring && currentNote.deadline) {
                // Duplicate note for next month
                const nextDate = new Date(currentNote.deadline);
                nextDate.setMonth(nextDate.getMonth() + 1);

                const newNote = await prisma.note.create({
                    data: {
                        title: currentNote.title,
                        content: currentNote.content,
                        color: currentNote.color,
                        isRecurring: true,
                        userId: user.id,
                        deadline: nextDate,
                        institutionId: currentNote.institutionId,
                        isCompleted: false
                    }
                });
                newNoteId = newNote.id;
            }
        }

        const note = await prisma.note.update({
            where: { id, userId: user.id },
            data
        });
        revalidatePath('/notes');
        revalidatePath('/calendar');
        return { success: true, note, newNoteId };
    } catch (error) {
        console.error("Error updating note:", error);
        return { success: false, error: "Failed to update note" };
    }
}

export async function deleteNote(id: string) {
    try {
        const user = await requireUser();
        await prisma.note.delete({
            where: { id, userId: user.id }
        });
        revalidatePath('/notes');
        revalidatePath('/calendar');
        return { success: true };
    } catch (error) {
        console.error("Error deleting note:", error);
        return { success: false, error: "Failed to delete note" };
    }
}
