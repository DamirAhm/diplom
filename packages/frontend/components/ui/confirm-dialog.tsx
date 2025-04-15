"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  lang: Locale;
  variant?: "destructive";
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  lang,
  variant,
  confirmText,
  cancelText,
}: ConfirmDialogProps) {
  const dictionary = getDictionary(lang);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card text-foreground dark:bg-secondary">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || dictionary.admin.confirmDelete}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description || dictionary.admin.confirmDelete}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText || dictionary.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn({
              "bg-destructive text-destructive-foreground hover:bg-destructive/90":
                variant === "destructive",
            })}
          >
            {confirmText || dictionary.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
