'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/src/types';
import ProductCard from './ProductCard';

interface AccountCarouselProps {
    products: Product[];
    institutionName: string;
    onSelect: (product: Product) => void;
    selectedProductId?: string;
}

export default function AccountCarousel({
    products,
    institutionName,
    onSelect,
    selectedProductId
}: AccountCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Check scroll position
    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(
                container.scrollLeft < container.scrollWidth - container.clientWidth - 10
            );
        }
    };

    useEffect(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                container.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [products]);

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container) {
            const cardWidth = 360 + 16; // card width + gap
            container.scrollBy({
                left: direction === 'left' ? -cardWidth : cardWidth,
                behavior: 'smooth'
            });
        }
    };

    if (products.length === 0) return null;

    return (
        <div className="relative w-full group">
            {/* Left Navigation Button */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
            )}

            {/* Right Navigation Button */}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto pb-6 pt-2 px-4 gap-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {products.map((product) => {
                    const isSelected = selectedProductId === product.id;

                    return (
                        <motion.div
                            key={product.id}
                            className="flex-shrink-0 w-[300px] sm:w-[360px] snap-start"
                            initial={false}
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <ProductCard
                                product={product}
                                institutionName={institutionName}
                                onClick={() => onSelect(product)}
                                isSelected={isSelected}
                            />
                        </motion.div>
                    );
                })}

                {/* Spacer to allow scrolling past the last card if needed, or just for padding consistency */}
                <div className="flex-shrink-0 w-4" />
            </div>

            {/* Pagination / Scroll Indicator (Minimalist) */}
            {products.length > 1 && (
                <div className="flex justify-start px-6 gap-1.5 mb-2">
                    {products.map((p) => (
                        <div
                            key={p.id}
                            className={`h-1 rounded-full transition-all duration-300 ${selectedProductId === p.id
                                ? 'w-6 bg-primary'
                                : 'w-1 bg-muted-foreground/20'
                                }`}
                        />
                    ))}
                </div>
            )}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}

