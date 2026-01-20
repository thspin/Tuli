import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/src/components/layout/AppLayout";
import { ClientProviders } from "@/src/components/ui/ClientProviders";

export const metadata: Metadata = {
    title: "Tuli AI - Finance OS",
    description: "Tu asistente financiero inteligente",
};

import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider localization={esMX}>
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
