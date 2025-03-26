import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
    message?: string;
    className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
    if (!message) return null;

    return (
        <div className={cn("flex items-center gap-2 text-destructive text-sm mt-2", className)}>
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
        </div>
    );
} 