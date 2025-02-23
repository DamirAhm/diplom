"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { SearchInput } from "./search-input";
import { Pagination } from "./pagination";
import { Spinner } from "./spinner";
import {
  SelectionProvider,
  SelectionHeader,
  SelectionCheckbox,
} from "./selection-provider";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTableState } from "@/hooks/use-table-state";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  identifier: (item: T) => any;
  onDelete?: (items: T[]) => void;
  searchPlaceholder?: string;
  tableId: string;
  lang: Locale;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  identifier,
  onDelete,
  searchPlaceholder,
  tableId,
  lang,
}: DataTableProps<T>) {
  const dictionary = getDictionary(lang);
  const { state, updateState } = useTableState(tableId);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updateState({ page: 1 });
  }, [state.search]);

  const filterData = (items: T[]) => {
    if (!state.search) return items;

    return items.filter((item) =>
      columns.some((column) => {
        const value =
          typeof column.accessorKey === "function"
            ? column.accessorKey(item)
            : String(item[column.accessorKey]);

        if (typeof value !== "string") {
          return false;
        }

        return value.toLowerCase().includes(state.search.toLowerCase());
      })
    );
  };

  const sortData = (items: T[]) => {
    if (!state.sortColumn) return items;

    return [...items].sort((a, b) => {
      const column = columns.find(
        (col) =>
          (typeof col.accessorKey === "string" &&
            col.accessorKey === state.sortColumn) ||
          (typeof col.accessorKey === "function" &&
            col.accessorKey.name === state.sortColumn)
      );

      if (!column) return 0;

      const valueA =
        typeof column.accessorKey === "function"
          ? column.accessorKey(a)
          : String(a[column.accessorKey]);
      const valueB =
        typeof column.accessorKey === "function"
          ? column.accessorKey(b)
          : String(b[column.accessorKey]);

      if (typeof valueA !== "string" || typeof valueB !== "string") return 0;

      if (valueA < valueB) return state.sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return state.sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const paginateData = (items: T[]) => {
    const startIndex = (state.page - 1) * state.pageSize;
    return items.slice(startIndex, startIndex + state.pageSize);
  };

  const filteredData = filterData(data);
  const sortedData = sortData(filteredData);
  const paginatedData = paginateData(sortedData);
  const totalPages = Math.ceil(filteredData.length / state.pageSize);

  const handleSort = useCallback(
    (column: Column<T>) => {
      if (!column.sortable) return;

      const columnKey =
        typeof column.accessorKey === "function"
          ? column.accessorKey.name
          : String(column.accessorKey);

      if (state.sortColumn === columnKey) {
        updateState({
          sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
        });
      } else {
        updateState({
          sortColumn: columnKey,
          sortDirection: "asc",
        });
      }
    },
    [state.sortColumn, state.sortDirection, updateState]
  );

  return (
    <SelectionProvider identifier={identifier}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SearchInput
            ref={searchInputRef}
            defaultValue={state.search}
            onSearch={(value) => updateState({ search: value, page: 1 })}
            placeholder={
              searchPlaceholder || dictionary.common.searchPlaceholder
            }
            className="w-64"
          />
        </div>

        <SelectionHeader
          items={paginatedData}
          lang={lang}
          onDelete={onDelete}
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <div />
                {columns.map((column, index) => (
                  <TableHead
                    key={index}
                    className={cn(
                      column.className,
                      column.sortable && "cursor-pointer hover:bg-accent"
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <div className="w-4 h-4">
                          {getSortIcon(column, state)}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onDelete ? 1 : 0)}
                    className="h-32 text-center"
                  >
                    <Spinner className="mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onDelete ? 1 : 0)}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {dictionary.common.noResults}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={identifier(item)}>
                    {onDelete && (
                      <TableCell>
                        <SelectionCheckbox item={item} />
                      </TableCell>
                    )}
                    {columns.map((column, cellIndex) => (
                      <TableCell key={cellIndex} className={column.className}>
                        {typeof column.accessorKey === "function"
                          ? column.accessorKey(item)
                          : String(item[column.accessorKey])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={state.page}
          totalPages={totalPages}
          pageSize={state.pageSize}
          totalItems={filteredData.length}
          onPageChange={(page) => updateState({ page })}
          onPageSizeChange={(pageSize) => updateState({ pageSize, page: 1 })}
          lang={lang}
        />
      </div>
    </SelectionProvider>
  );
}

function getSortIcon<T>(
  column: Column<T>,
  state: { sortColumn: string | null; sortDirection: "asc" | "desc" }
) {
  if (!column.sortable) return null;

  const columnKey =
    typeof column.accessorKey === "function"
      ? column.accessorKey.name
      : String(column.accessorKey);

  if (state.sortColumn === columnKey) {
    return state.sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  }

  return <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100" />;
}
