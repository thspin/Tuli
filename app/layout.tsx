import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/src/components/layout/AppLayout";
import { ClientProviders } from "@/src/components/ui/ClientProviders";
import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";

export const metadata: Metadata = {
    title: "Tuli AI - Finance OS",
    description: "Tu asistente financiero inteligente",
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Check if Clerk keys are available
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    // If no Clerk key, render without ClerkProvider (for debugging)
    if (!clerkPublishableKey) {
        return (
            <html lang="es" suppressHydrationWarning>
                <head>
                    <link rel="preconnect" href="https://rsms.me/" />
                    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                        rel="stylesheet"
                    />
                </head>
                <body className="antialiased" suppressHydrationWarning>
                    <ClientProviders>
                        <AppLayout>{children}</AppLayout>
                    </ClientProviders>
                </body>
            </html>
        );
    }

    return (
        <ClerkProvider
            localization={esMX}
            publishableKey={clerkPublishableKey}
        >
            <html lang="es" suppressHydrationWarning>
                <head>
                    <link rel="preconnect" href="https://rsms.me/" />
                    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                        rel="stylesheet"
                    />
                </head>
                <body className="antialiased" suppressHydrationWarning>
                    <ClientProviders>
                        <AppLayout>{children}</AppLayout>
                    </ClientProviders>
                </body>
            </html>
        </ClerkProvider>
    );
}
