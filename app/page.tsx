import Link from 'next/link'

export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">
                    Bienvenido a Tuli
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Tu aplicación Next.js con Prisma está lista 🚀
                </p>

                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mb-6">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                        Próximos pasos:
                    </h2>
                    <ul className="text-left space-y-2 text-gray-600">
                        <li>✅ Next.js configurado</li>
                        <li>✅ Prisma instalado</li>
                        <li>✅ TypeScript listo</li>
                        <li>🎯 Comienza a construir tu aplicación</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                        Navegación:
                    </h2>
                    <div className="space-y-3">
                        <Link
                            href="/accounts"
                            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            📊 Ver Mis Cuentas
                        </Link>
                        <Link
                            href="/summaries"
                            className="block w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                        >
                            📄 Ver Resúmenes
                        </Link>
                        <Link
                            href="/categories"
                            className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
                        >
                            🏷️ Gestionar Categorías
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
