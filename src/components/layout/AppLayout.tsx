'use client'

import SlimSidebar from './SlimSidebar'

interface AppLayoutProps {
    children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen w-full font-sans selection:bg-primary/30 relative overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="fixed inset-0 glass-bg-animated -z-10" />

            {/* Subtle animated orbs for depth */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-glass-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-glass-float" style={{ animationDelay: '-3s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full filter blur-3xl animate-glass-float" style={{ animationDelay: '-1.5s' }} />
            </div>

            {/* Sidebar (Fixed) */}
            <SlimSidebar />

            {/* Main Content Area (Full width, with bottom padding for floating menu) */}
            <div className="min-h-screen flex flex-col relative transition-all duration-300 ease-in-out pb-32 md:pb-36">
                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
