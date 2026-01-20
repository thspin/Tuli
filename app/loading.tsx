export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-white/60">Cargando...</p>
            </div>
        </div>
    )
}
