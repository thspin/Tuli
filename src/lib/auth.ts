import { prisma } from "@/src/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Obtiene el usuario actual autenticado (Clerk + DB Sync).
 * Si no existe en la base de datos, lo crea automáticamente.
 */
export async function getCurrentUser() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        // En Next.js App Router esto normalmente se maneja con middleware,
        // pero por seguridad retornamos null o lanzamos error si se llama en server actions protegidas.
        return null;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
        throw new Error("El usuario no tiene email principal");
    }

    // Buscar usuario en DB
    let user = await prisma.user.findUnique({
        where: { email }
    });

    // Si no existe, crearlo (Sync)
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Usuario',
                // Si agregas clerkId al schema, guárdalo aquí también:
                // clerkId: clerkUser.id
            }
        });
    }

    return user;
}

/**
 * Helper para forzar autenticación en Server Actions
 */
export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/sign-in');
    }
    return user;
}

// Retro-compatibilidad para no romper todas las llamadas existentes a getDemoUser

