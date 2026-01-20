import { InstitutionWithProducts } from '@/src/types';

interface InstitutionListItemProps {
    institution: InstitutionWithProducts;
    onClick: () => void;
    isSelected?: boolean;
}

export default function InstitutionListItem({ institution, onClick, isSelected }: InstitutionListItemProps) {
    const getColorFromName = (name: string) => {
        const colors = [
            { bg: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/30' },
            { bg: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/30' },
            { bg: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/30' },
            { bg: 'from-pink-500 to-pink-600', glow: 'shadow-pink-500/30' },
            { bg: 'from-orange-500 to-orange-600', glow: 'shadow-orange-500/30' },
            { bg: 'from-indigo-500 to-indigo-600', glow: 'shadow-indigo-500/30' },
            { bg: 'from-rose-500 to-rose-600', glow: 'shadow-rose-500/30' },
            { bg: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/30' },
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getShortName = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('mercado') || lowerName.includes('mp')) return 'MP';
        if (lowerName.includes('astropay')) return 'Astro';
        if (lowerName.includes('bbva')) return 'BBVA';
        if (lowerName.includes('nacion') || lowerName.includes('nación') || lowerName.includes('bna')) return 'BNA';
        if (lowerName.includes('galicia')) return 'Galicia';
        if (lowerName.includes('naranja')) return 'Naranja';
        if (lowerName.includes('personal')) return 'Personal';
        if (lowerName.includes('claro')) return 'Claro';
        if (lowerName.includes('rioja')) return 'Rioja';
        if (lowerName.includes('takenos')) return 'Takenos';

        const words = name.split(' ');
        if (words[0].length <= 8) return words[0];
        return name.substring(0, 8);
    };

    const color = getColorFromName(institution.name);
    const shortName = getShortName(institution.name);

    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative text-left
                ${isSelected
                    ? 'bg-white/20 border border-white/30 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20'
                }
            `}
            title={institution.name}
        >
            {/* Icon */}
            <div className={`
                w-12 h-12 rounded-xl bg-gradient-to-br ${color.bg} 
                flex items-center justify-center flex-shrink-0 overflow-hidden 
                transform group-hover:scale-105 transition-transform duration-300
                shadow-lg ${color.glow}
            `}>
                <span className="text-white font-black text-sm leading-tight text-center">
                    {shortName}
                </span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <span className="text-white font-semibold text-sm block truncate">
                    {institution.name}
                </span>
                <span className="text-white/50 text-xs">
                    {institution.products.length} producto{institution.products.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Selected indicator */}
            {isSelected && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <span className="material-symbols-outlined text-white text-sm">check</span>
                </div>
            )}
        </button>
    );
}
