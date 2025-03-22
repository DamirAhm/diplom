"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

export function ImagePreview({ src, alt, width = 64, height = 64, className = "" }: ImagePreviewProps) {
    const [isOpen, setIsOpen] = useState(false);
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
        <>
            <div className="cursor-pointer relative" onClick={() => setIsOpen(true)}>
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className={cn("object-contain", className)}
                    onError={() => setError(true)}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl p-0 border-0">
                    <div className="relative aspect-video w-full">
                        <Image
                            src={src}
                            alt={alt}
                            fill
                            className="object-contain"
                            priority
                            onError={() => setError(true)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 