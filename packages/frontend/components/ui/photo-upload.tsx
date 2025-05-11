import { useState } from "react";
import { Button } from "./button";
import { Trash2, Upload } from "lucide-react";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/api";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "./carousel";

export interface PhotoItem {
    id: number;
    url: string;
    order?: number;
}

interface PhotoUploadProps {
    photoUrl?: string;
    photos?: PhotoItem[];
    onPhotoChange?: (url: string) => void;
    onPhotosChange?: (photos: PhotoItem[]) => void;
    buttonLabel: string;
    errorMessage?: string;
    className?: string;
    previewSize?: number;
    multiple?: boolean;
}

export function PhotoUpload({
    photoUrl,
    photos = [],
    onPhotoChange,
    onPhotosChange,
    buttonLabel,
    errorMessage = "Failed to upload image",
    className = "",
    previewSize = 100,
    multiple = false,
}: PhotoUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        try {
            if (multiple) {
                const filesRes = await Promise.allSettled(
                    Array.from(e.target.files).map(async (file, index) => {
                        const response = await uploadFile(file);
                        return {
                            id: Date.now() + index,
                            url: response.url,
                            order: photos.length + index,
                        };
                    })
                ).then((res) => res.filter((r) => r.status === "fulfilled"));

                const newPhotos = filesRes.map((res) => (res as any).value);
                onPhotosChange?.([...photos, ...newPhotos]);
            } else {
                const file = e.target.files[0];
                const { url } = await uploadFile(file);
                onPhotoChange?.(url);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = (photoId: number) => {
        onPhotosChange?.(photos.filter((photo) => photo.id !== photoId));
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => document.getElementById("photo-upload")?.click()}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? "Uploading..." : buttonLabel}
                </Button>
                <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </div>

            {multiple ? (
                photos.length > 0 && (
                    <div className="mt-4 w-[300px]">
                        <Carousel opts={{ loop: true }}>
                            <CarouselContent>
                                {photos.map((photo) => (
                                    <CarouselItem key={photo.id}>
                                        <div className="relative">
                                            <ImageWithFallback
                                                width={300}
                                                height={300}
                                                src={photo.url}
                                                alt="Uploaded photo"
                                                className="object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={() => handleRemovePhoto(photo.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious type="button" />
                            <CarouselNext type="button" />
                        </Carousel>
                    </div>
                )
            ) : (
                photoUrl && (
                    <div className="mt-2">
                        <ImageWithFallback
                            src={photoUrl}
                            alt="Uploaded photo"
                            width={previewSize}
                            height={previewSize}
                            className="rounded-md object-cover"
                        />
                    </div>
                )
            )}
        </div>
    );
} 