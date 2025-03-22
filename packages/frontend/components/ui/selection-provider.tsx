"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";

interface SelectionContextType<T> {
  selectedItems: T[];
  toggleSelection: (item: T) => void;
  isSelected: (item: T) => boolean;
  selectAll: (items: T[]) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType<any>>({
  selectedItems: [],
  toggleSelection: () => { },
  isSelected: () => false,
  selectAll: () => { },
  clearSelection: () => { },
});

interface SelectionProviderProps<T> {
  children: React.ReactNode;
  identifier: (item: T) => any;
}

export function SelectionProvider<T>({
  children,
  identifier,
}: SelectionProviderProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([]);

  const toggleSelection = useCallback(
    (item: T) => {
      setSelectedItems((prev) => {
        const id = identifier(item);
        const isSelected = prev.some((i) => identifier(i) === id);
        if (isSelected) {
          return prev.filter((i) => identifier(i) !== id);
        }
        return [...prev, item];
      });
    },
    [identifier]
  );

  const isSelected = useCallback(
    (item: T) => {
      const id = identifier(item);
      return selectedItems.some((i) => identifier(i) === id);
    },
    [selectedItems, identifier]
  );

  const selectAll = useCallback((items: T[]) => {
    setSelectedItems(items);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        selectedItems,
        toggleSelection,
        isSelected,
        selectAll,
        clearSelection,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection<T>() {
  return useContext(SelectionContext) as SelectionContextType<T>;
}

interface SelectionHeaderProps<T> {
  items: T[];
  lang: Locale;
  onDelete?: (items: T[]) => void;
}

export function SelectionHeader<T>({
  items,
  lang,
  onDelete,
}: SelectionHeaderProps<T>) {
  const { selectedItems, selectAll, clearSelection } = useSelection<T>();
  const dictionary = getDictionary(lang);

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      clearSelection();
    } else {
      selectAll(items);
    }
  };

  const handleDelete = () => {
    if (onDelete && selectedItems.length > 0) {
      onDelete(selectedItems);
      clearSelection();
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-2">
      <div className="flex items-center space-x-4">
        <Checkbox
          checked={selectedItems.length === items.length}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          {selectedItems.length} {dictionary.common.selected}
        </span>
      </div>
      <div className="space-x-2">
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            {dictionary.common.deleteSelected}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={clearSelection}>
          {dictionary.common.clearSelection}
        </Button>
      </div>
    </div>
  );
}

interface SelectionCheckboxProps<T> {
  item: T | null;
}

export function SelectionCheckbox<T>({ item }: SelectionCheckboxProps<T>) {
  const { toggleSelection, isSelected } = useSelection<T>();

  return (
    <Checkbox
      className="w-4 h-4 border-primary dark:border-primary-foreground"
      checked={item ? isSelected(item) : false}
      onCheckedChange={() => item && toggleSelection(item)}
    />
  );
}
