'use client'

import { useState } from 'react';
import { Product } from '@/src/types';
import ProductCard from './ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

interface CreditCardStackProps {
    products: Product[];
    institutionName: string;
    onSelect: (product: Product) => void;
    selectedProductId?: string;
}

export default function CreditCardStack({
    products,
    institutionName,
    onSelect,
    selectedProductId
}: CreditCardStackProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // If we have few products, display them side-by-side without the stacking effect
    if (products.length <= 2) {
        return (
            <div className="flex justify-start items-center gap-6 py-4 min-h-[280px] pl-4">
                {products.map(product => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-[280px] sm:w-[320px]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(product)}
                    >
                        <div className={`transition-all duration-300 rounded-[20px] ${selectedProductId === product.id ? 'ring-2 ring-blue-600 shadow-xl' : 'shadow-lg hover:shadow-xl'}`}>
                            <ProductCard
                                product={product}
                                institutionName={institutionName}
                                onClick={() => onSelect(product)}
                                isSelected={selectedProductId === product.id}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-start pl-4 py-4 min-h-[280px] relative overflow-x-visible">
            <div className="flex items-center -space-x-48 sm:-space-x-56 md:-space-x-64 perspective-1000">
                {products.map((product, index) => {
                    // Determine z-index logic
                    // Default: Stacking from left to right (0, 1, 2)
                    // Hovered: The hovered item gets max z-index (50)
                    // If hovered exists:
                    //   - Items to the left of processed item shift left
                    //   - Items to the right of processed item shift right

                    const isHovered = hoveredIndex === index;
                    const isSelected = selectedProductId === product.id;

                    // Z-Index calculation
                    let zIndex = index;
                    if (hoveredIndex !== null) {
                        if (index === hoveredIndex) {
                            zIndex = 50;
                        } else if (index < hoveredIndex) {
                            // Keep original relative z-index but lower than hovered
                            zIndex = index;
                        } else {
                            // Keep original relative order but lower
                            // Actually, for a visual stack, left to right, we want the right ones on top usually or left ones?
                            // Standard overlap implies next element is on top of previous (0 lowest, last highest).
                            // We want hover to pop out.
                            // So standard z-index = index is fine.
                            // But hovered must be > all others.
                        }
                    }

                    const isPanelOpen = !!selectedProductId;

                    // Transform logic
                    let xOffset = 0;
                    let scale = 1;
                    let brightness = 1;

                    // Only apply hover spread if NO card is currently selected (panel closed)
                    if (hoveredIndex !== null && !isPanelOpen) {
                        if (index === hoveredIndex) {
                            scale = 1.15;
                            brightness = 1;
                        } else if (index < hoveredIndex) {
                            // Shift left significantly to clear the view
                            xOffset = -180; // Much larger shift
                            scale = 0.85;
                            brightness = 0.5; // Dim the others
                        } else {
                            // Shift right significantly
                            xOffset = 180;
                            scale = 0.85;
                            brightness = 0.5;
                        }
                    } else {
                        // Default state: stacked with consistent overlap
                        // Center is 0
                        const center = (products.length - 1) / 2;
                        // Just spread them out a bit less when idle
                        // xOffset = (index - center) * 40; 

                        if (isSelected) {
                            scale = 1.1;
                            brightness = 1;
                            // If selected but not hovered, maybe bring it to front?
                            if (index < products.findIndex(p => p.id === selectedProductId)) {
                                xOffset = -50;
                            } else if (index > products.findIndex(p => p.id === selectedProductId)) {
                                xOffset = 50;
                            }
                            // If this IS the selected one, it stays center (0 offset in relative terms of flow, but we are using flex)
                            // actually flex handles positions, x is 'transform'.
                        } else {
                            // If nothing selected or hovered, standard stack
                            // We can use the brightness to signify depth if we want, but user wants "horizontal and aligned"
                            scale = 1;
                        }

                        // If selected exists elsewhere, dim this one
                        if (selectedProductId && !isSelected) {
                            brightness = 0.7;
                            scale = 0.95;
                        }
                    }

                    // Force selected to have high z-index if no hover
                    if (hoveredIndex === null && isSelected) {
                        zIndex = 40;
                    }

                    return (
                        <motion.div
                            key={product.id}
                            className={`relative min-w-[280px] sm:min-w-[320px] md:min-w-[350px] aspect-[1.586] origin-center`}
                            style={{
                                zIndex: (isHovered && !isPanelOpen) ? 100 : zIndex,
                            }}
                            animate={{
                                x: xOffset,
                                scale: scale,
                                filter: `brightness(${brightness})`,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => onSelect(product)}
                        >
                            <div className={`transition-all duration-300 rounded-2xl ${isSelected ? 'ring-4 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.6)]' : 'shadow-2xl'} ${isHovered ? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]' : ''}`}>
                                <ProductCard
                                    product={product}
                                    institutionName={institutionName}
                                    onClick={() => onSelect(product)}
                                    isSelected={isSelected}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
