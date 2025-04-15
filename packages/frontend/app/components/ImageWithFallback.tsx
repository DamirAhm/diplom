"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    fallbackType?: 'icon' | 'initials';
    fallbackClassName?: string;
    fallbackIconClassName?: string;
    fallbackTextClassName?: string;
    fill?: boolean;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    priority?: boolean;
}

export function ImageWithFallback({
    src,
    alt,
    width = 64,
    height = 64,
    className = "",
    fallbackType = 'icon',
    fallbackClassName = "",
    fallbackIconClassName = "",
    fallbackTextClassName = "",
    fill = false,
    objectFit = "cover",
    priority = false
}: ImageWithFallbackProps) {
    const [error, setError] = useState(false);

    const getInitials = (name: string) => {
        const parts = name.split(' ').filter(p => p.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    if (error || !src) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-muted/30 dark:bg-muted/20 text-foreground/60 rounded overflow-hidden",
                    className,
                    fallbackClassName
                )}
                style={!fill ? { width, height } : { position: 'absolute', inset: 0 }}
            >
                {fallbackType === 'icon' ? (
                    <User className={cn("w-1/3 h-1/3", fallbackIconClassName)} />
                ) : (
                    <span className={cn("text-lg font-medium", fallbackTextClassName)}>{getInitials(alt)}</span>
                )}
            </div>
        );
    }

    const imageUrl = src.startsWith('http') ? src : new URL(src, process.env.NEXT_PUBLIC_API_URL).toString();

    if (fill) {
        return (
            <Image
                src={imageUrl}
                alt={alt}
                fill
                className={cn(`object-${objectFit}`, className)}
                onError={() => setError(true)}
                priority={priority}
            />
        );
    }

    return (
        <Image
            src={imageUrl}
            alt={alt}
            width={width}
            height={height}
            className={cn(`object-${objectFit}`, className)}
            onError={() => setError(true)}
            priority={priority}
        />
    );
} 