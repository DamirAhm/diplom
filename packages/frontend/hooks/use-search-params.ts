"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSearchParamsState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setSearchParam = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (value === null) {
        params.delete(name);
      } else {
        params.set(name, value);
      }

      const query = params.toString();
      const url = pathname + (query ? `?${query}` : "");
      
      router.push(url);
    },
    [pathname, router, searchParams]
  );

  const getSearchParam = useCallback(
    (name: string) => {
      return searchParams.get(name);
    },
    [searchParams]
  );

  return {
    setSearchParam,
    getSearchParam,
  };
}