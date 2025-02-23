"use client";

import { useRef, useEffect } from "react";

interface UseFormNavigationProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export function useFormNavigation({
  onSave,
  onCancel,
}: UseFormNavigationProps = {}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onCancel) {
        onCancel();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "s" && onSave) {
        event.preventDefault();
        onSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave, onCancel]);

  return { formRef };
}
