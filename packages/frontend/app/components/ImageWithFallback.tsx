"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

export function ImageWithFallback({ src, alt, width = 64, height = 64, className = "" }: ImageWithFallbackProps) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-gray-100 dark:bg-primary rounded",
                    className
                )}
                style={{ width, height }}
            >
                <span className="text-gray-500 dark:text-gray-400 text-sm">No image</span>
            </div>
        );
    }

    return (
        <Image
            src={new URL(src, process.env.NEXT_PUBLIC_API_URL).toString()}
            alt={alt}
            width={width}
            height={height}
            className={className}
            onError={() => setError(true)}
        />
    );
} 