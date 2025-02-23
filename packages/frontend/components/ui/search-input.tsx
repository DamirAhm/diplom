"use client";

import { Input } from "./input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { ForwardedRef, forwardRef, useEffect, useState } from "react";

interface SearchInputProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  defaultValue?: string;
}

export const SearchInput = forwardRef(({
  onSearch,
  placeholder = "Search...",
  className,
  debounceMs = 300,
  defaultValue = "",
}: SearchInputProps, ref: ForwardedRef<HTMLDivElement>) => {
  const [value, setValue] = useState(defaultValue);
  const debouncedSearch = useDebounce(onSearch, debounceMs);

  useEffect(() => {
    debouncedSearch(defaultValue);
  }, [value, debouncedSearch]);

  return (
    <div className="relative" ref={ref}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`pl-9 ${className}`}
        placeholder={placeholder}
        type="search"
      />
    </div>
  );
});