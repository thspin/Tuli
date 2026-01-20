export interface Note {
    id: string;
    title: string;
    content?: string | null;
    color: string;
    deadline?: Date | string | null; // Allow string for serialization
    isRecurring: boolean;
    institutionId?: string | null;
    institution?: { id: string; name: string } | null;
    isCompleted: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    userId: string;
}
