import { getNotes } from "@/src/actions/notes";
import NotesClient from "@/src/components/notes/NotesClient";
import { Note } from "@/src/types/note.types";

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
    const { success, notes } = await getNotes();

    // We can assume strict strict serialization isn't needed for Date objects in recent Next.js versions passing to Client Components, 
    // but if issues arise, we can serialize.

    return (
        <NotesClient notes={(notes || []) as unknown as Note[]} />
    );
}
