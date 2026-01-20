export const getServiceIcon = (name: string, categoryIcon?: string | null) => {
    const lowerName = name.toLowerCase();

    // Gas
    if (lowerName.includes('gas') || lowerName.includes('naturgy') || lowerName.includes('metro')) return '🔥';

    // Luz / Electricidad
    if (lowerName.includes('luz') || lowerName.includes('electric') || lowerName.includes('edelar') || lowerName.includes('edenor') || lowerName.includes('edesur') || lowerName.includes('coop')) return '⚡';

    // Agua
    if (lowerName.includes('agua') || lowerName.includes('aysa')) return '💧';

    // Internet / Cable
    if (lowerName.includes('internet') || lowerName.includes('wifi') || lowerName.includes('fiber') || lowerName.includes('telecentro') || lowerName.includes('personal') || lowerName.includes('flow') || lowerName.includes('starlink')) return '🌐';

    // Telefonía
    if (lowerName.includes('celular') || lowerName.includes('movil') || lowerName.includes('claro') || lowerName.includes('movistar') || lowerName.includes('tuenti') || lowerName.includes('linea')) return '📱';

    // Seguros
    if (lowerName.includes('seguro') || lowerName.includes('poliza') || lowerName.includes('patronal') || lowerName.includes('federacion') || lowerName.includes('zurich') || lowerName.includes('allianz')) return '🛡️';

    // Salud
    if (lowerName.includes('salud') || lowerName.includes('medicina') || lowerName.includes('prepaga') || lowerName.includes('osde') || lowerName.includes('swiss') || lowerName.includes('galeno')) return '🏥';

    // Impuestos
    if (lowerName.includes('municipal') || lowerName.includes('rentas') || lowerName.includes('abl') || lowerName.includes('patente') || lowerName.includes('arba') || lowerName.includes('agip')) return '🏛️';

    // Streaming (Extra)
    if (lowerName.includes('netflix') || lowerName.includes('spotify') || lowerName.includes('hbo') || lowerName.includes('amazon') || lowerName.includes('disney')) return '🎬';

    // Tarjetas
    if (lowerName.includes('visa') || lowerName.includes('master') || lowerName.includes('amex') || lowerName.includes('tarjeta')) return '💳';


    // Default to category icon or fallback
    return categoryIcon || '📄';
};
