"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "./ImageWithFallback";
import Image from "next/image";

interface ImagePreviewProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

export function ImagePreview({ src, alt, width = 64, height = 64, className = "" }: ImagePreviewProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="cursor-pointer relative" onClick={() => setIsOpen(true)}>
                <ImageWithFallback
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className={cn("object-contain", className)}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl p-0 border-0">
                    <div className="relative aspect-video w-full">
                        <ImageWithFallback
                            src={src}
                            alt={alt}
                            fill
                            objectFit="contain"
                            className="rounded-md"
                            fallbackClassName="rounded-md"
                            priority
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 