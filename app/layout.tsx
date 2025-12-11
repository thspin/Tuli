import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/src/components/ui/ClientProviders";

export const metadata: Metadata = {
    title: "Tuli - Gestión Financiera",
    description: "Tu aplicación de finanzas personales",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="font-sans antialiased" suppressHydrationWarning>
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
