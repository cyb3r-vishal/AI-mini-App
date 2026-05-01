'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListRecordsQuery } from '@ai-gen/shared';
import { api, type RecordItem, type RecordListResult } from '@/lib/api-client';
import { useDataSource } from '@/registry/data-source';

export interface UseDynamicRecordsOptions {
  appId: string;
  entityKey: string;
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: string;
  initialFilter?: Record<string, unknown>;
  initialSearch?: string;
  /** Disable fetching (e.g. until required params are ready). */
  enabled?: boolean;
}

export interface UseDynamicRecordsReturn {
  items: RecordItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;

  isLoading: boolean;
  isRefetching: boolean;
  error: string | null;

  search: string;
  setSearch: (q: string) => void;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
  setSort: (s: string | undefined) => void;
  setFilter: (f: Record<string, unknown> | undefined) => void;

  refetch: () => Promise<void>;
  /** Remove an item by id from local state (optimistic delete). */
  removeLocal: (id: string) => void;
}

/**
 * Dynamic record loader.
 *
 * - Debounces `search` changes (250ms).
 * - Shows `isLoading` on first load, `isRefetching` on subsequent.
 * - Ignores stale responses from old requests.
 * - `removeLocal` lets callers do optimistic deletes.
 */
export function useDynamicRecords(opts: UseDynamicRecordsOptions): UseDynamicRecordsReturn {
  const { appId, entityKey, enabled = true } = opts;
  const ds = useDataSource();

  const [items, setItems] = useState<RecordItem[]>([]);
  const [page, setPage] = useState(opts.initialPage ?? 1);
  const [pageSize, setPageSize] = useState(opts.initialPageSize ?? 25);
  const [sort, setSort] = useState<string | undefined>(opts.initialSort);
  const [filter, setFilter] = useState<Record<string, unknown> | undefined>(
    opts.initialFilter,
  );
  const [search, setSearchState] = useState(opts.initialSearch ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const firstLoadRef = useRef(true);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOnce = useCallback(async () => {
    if (!enabled || !appId || !entityKey) {
      setIsLoading(false);
      return;
    }

    const myReq = ++requestIdRef.current;
    if (firstLoadRef.current) {
      setIsLoading(true);
    } else {
      setIsRefetching(true);
    }
    setError(null);

    const query: Partial<ListRecordsQuery> = {
      page,
      pageSize,
      sort,
      q: debouncedSearch || undefined,
      filter: filter && Object.keys(filter).length > 0 ? JSON.stringify(filter) : undefined,
    };

    try {
      const res: RecordListResult = ds
        ? await ds.listRecords(entityKey, query)
        : await api.records.list(appId, entityKey, query);
      if (myReq !== requestIdRef.current) return; // stale
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      if (myReq !== requestIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load records';
      setError(message);
      setItems([]);
      setTotal(0);
    } finally {
      if (myReq === requestIdRef.current) {
        setIsLoading(false);
        setIsRefetching(false);
        firstLoadRef.current = false;
      }
    }
  }, [ds, appId, entityKey, enabled, page, pageSize, sort, filter, debouncedSearch]);

  useEffect(() => {
    void fetchOnce();
  }, [fetchOnce]);

  // Reset to page 1 when search/filter/sort change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter, sort, pageSize]);

  const setSearch = useCallback((q: string) => setSearchState(q), []);
  const refetch = useCallback(async () => {
    await fetchOnce();
  }, [fetchOnce]);
  const removeLocal = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    isLoading,
    isRefetching,
    error,
    search,
    setSearch,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    refetch,
    removeLocal,
  };
}
