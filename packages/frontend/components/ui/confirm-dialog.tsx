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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  lang: Locale;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  lang,
}: ConfirmDialogProps) {
  const dictionary = getDictionary(lang);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-primary dark:bg-primary">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || dictionary.admin.confirmDelete}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description || dictionary.admin.confirmDelete}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            {dictionary.common.delete}
          </AlertDialogAction>
          <AlertDialogCancel>{dictionary.common.cancel}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
