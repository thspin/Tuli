// Force dynamic rendering - Clerk requires publishableKey at build time
export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                <p className="text-white/60 text-lg mb-8">Página no encontrada</p>
                <a
                    href="/"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                    Volver al inicio
                </a>
            </div>
        </div>
    );
}
