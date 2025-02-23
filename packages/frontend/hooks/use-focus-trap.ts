"use client";

import { useEffect, useRef } from "react";

interface UseFocusTrapOptions {
  enabled?: boolean;
}

export function useFocusTrap({ enabled = true }: UseFocusTrapOptions = {}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const element = elementRef.current;
    if (!element) return;
  }, [enabled]);

  return elementRef;
}