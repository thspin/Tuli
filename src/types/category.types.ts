// src/types/category.types.ts
import { CategoryType } from '@prisma/client';

export interface Category {
    id: string;
    name: string;
    icon: string | null;
    categoryType: CategoryType;
    isSystem: boolean;
}

export type CategoryFormData = {
    name: string;
    icon: string;
    categoryType: CategoryType;
};

export const COMMON_CATEGORY_EMOJIS = [
    '🛒', '🛍️', '🍽️', '🍻', '🚗', '🚌', '🛵', '✈️', '🌍', // Shopping & Transport
    '🏠', '💡', '⚡', '🔥', '🔧', '💊', '🩹', '🏥', '💅', '👔', '🎓', // Home, Health, Personal
    '💰', '💸', '💵', '💳', '🏦', '🛡️', '💼', '📉', '🧾', // Financial
    '🎮', '🎬', '🍿', '🎁', '📱', '📞', '🌐', '🏷️' // Entertainment & Misc
];
