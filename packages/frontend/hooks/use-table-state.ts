"use client";

import { useState, useEffect } from "react";
import { useSearchParamsState } from "./use-search-params";

interface TableState {
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  search: string;
  filter: string;
}

const defaultState: TableState = {
  page: 1,
  pageSize: 10,
  sortColumn: null,
  sortDirection: "asc",
  search: "",
  filter: "",
};

export function useTableState(tableId: string) {
  const { setSearchParam, getSearchParam } = useSearchParamsState();
  const [state, setState] = useState<TableState>(() => {
    return {
      page: Number(getSearchParam(`${tableId}_page`)) || defaultState.page,
      pageSize: Number(getSearchParam(`${tableId}_pageSize`)) || defaultState.pageSize,
      sortColumn: getSearchParam(`${tableId}_sortColumn`) || defaultState.sortColumn,
      sortDirection: (getSearchParam(`${tableId}_sortDir`) as "asc" | "desc") || defaultState.sortDirection,
      search: getSearchParam(`${tableId}_search`) || defaultState.search,
      filter: getSearchParam(`${tableId}_filter`) || defaultState.filter,
    };
  });

  useEffect(() => {
    setSearchParam(`${tableId}_page`, state.page.toString());
    setSearchParam(`${tableId}_pageSize`, state.pageSize.toString());
    setSearchParam(`${tableId}_sortColumn`, state.sortColumn || null);
    setSearchParam(`${tableId}_sortDir`, state.sortDirection);
    setSearchParam(`${tableId}_search`, state.search || null);
    setSearchParam(`${tableId}_filter`, state.filter || null);
  }, [state, tableId, setSearchParam]);

  const updateState = (updates: Partial<TableState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return {
    state,
    updateState,
    resetState: () => setState(defaultState),
  };
}