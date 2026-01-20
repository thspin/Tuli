export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-600">Cargando...</p>
            </div>
        </div>
    )
}
