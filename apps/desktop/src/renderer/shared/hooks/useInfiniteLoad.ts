/**
 * useInfiniteLoad Hook
 *
 * A custom hook to handle infinite scrolling/pagination logic.
 * Manages loading state, pagination metadata, and deduplication of items.
 *
 * @module renderer/shared/hooks/useInfiniteLoad
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============ Types ============

/**
 * Standard pagination metadata structure.
 */
export interface PaginationInfo {
  /** Current page number (1-based). */
  page: number;
  /** Number of items per page. */
  pageSize: number;
  /** Total number of items across all pages. */
  total: number;
  /** Total number of pages. */
  totalPages: number;
  /** Whether a next page exists. */
  hasNext: boolean;
  /** Whether a previous page exists. */
  hasPrev: boolean;
}

/**
 * Response structure expected from the fetcher.
 *
 * @template T Type of the data items.
 */
export interface PaginatedResponse<T> {
  /** Array of fetched items. */
  data: T[];
  /** Pagination metadata. */
  pagination: PaginationInfo;
}

/**
 * Configuration options for useInfiniteLoad.
 *
 * @template T Type of data items.
 * @template P Type of additional query parameters.
 */
export interface UseInfiniteLoadOptions<T, P = Record<string, unknown>> {
  /** Async function to fetch a page of data. */
  fetcher: (params: P & { page: number; pageSize: number }) => Promise<PaginatedResponse<T>>;
  /** Additional filter/sort parameters to pass to the fetcher. */
  params?: P;
  /** Number of items to fetch per page. Defaults to 20. */
  pageSize?: number;
  /** Whether to trigger the first fetch on mount. Defaults to true. */
  loadOnMount?: boolean;
  /** Function to extract a unique key from an item for deduplication. */
  getItemKey: (item: T) => string | number;
}

/**
 * Result returned by useInfiniteLoad.
 *
 * @template T Type of data items.
 */
export interface UseInfiniteLoadResult<T> {
  /** All loaded items accumulated so far. */
  items: T[];
  /** Whether the initial load or a refresh is in progress. */
  loading: boolean;
  /** Whether a "load more" operation is in progress. */
  loadingMore: boolean;
  /** Error message if a fetch failed. */
  error: string | null;
  /** Current pagination state. */
  pagination: PaginationInfo | null;
  /** Convenience flag indicating if more pages are available. */
  hasMore: boolean;
  /** Function to trigger loading the next page. */
  loadMore: () => Promise<void>;
  /** Function to reset and reload from the first page. */
  refresh: () => Promise<void>;
  /** Function to clear all data and reset state. */
  reset: () => void;
}

// ============ Constants ============

const DEFAULT_PAGE_SIZE = 20;

// ============ Hook ============

/**
 * Hook for managing infinite scroll data fetching.
 *
 * @example
 * ```tsx
 * const {
 *   items,
 *   loading,
 *   loadingMore,
 *   hasMore,
 *   loadMore,
 *   refresh,
 * } = useInfiniteLoad({
 *   fetcher: (params) => goalApiClient.getGoals(params),
 *   getItemKey: (goal) => goal.id,
 *   pageSize: 20,
 * });
 *
 * return (
 *   <VirtualList
 *     items={items}
 *     onEndReached={loadMore}
 *     renderItem={(goal) => <GoalCard goal={goal} />}
 *   />
 * );
 * ```
 *
 * @template T Item type.
 * @template P Params type.
 * @param {UseInfiniteLoadOptions<T, P>} options - Configuration options.
 * @returns {UseInfiniteLoadResult<T>} The state and control functions.
 */
export function useInfiniteLoad<T, P = Record<string, unknown>>(
  options: UseInfiniteLoadOptions<T, P>
): UseInfiniteLoadResult<T> {
  const {
    fetcher,
    params,
    pageSize = DEFAULT_PAGE_SIZE,
    loadOnMount = true,
    getItemKey,
  } = options;

  // State
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Refs
  const currentPageRef = useRef(0);
  const loadingRef = useRef(false);
  const seenKeysRef = useRef(new Set<string | number>());

  // ============ Load Functions ============

  const loadPage = useCallback(
    async (page: number, isRefresh: boolean = false) => {
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        if (isRefresh || page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await fetcher({
          ...params,
          page,
          pageSize,
        } as P & { page: number; pageSize: number });

        // Deduplicate items based on unique key
        const newItems = response.data.filter((item) => {
          const key = getItemKey(item);
          if (seenKeysRef.current.has(key)) {
            return false;
          }
          seenKeysRef.current.add(key);
          return true;
        });

        if (isRefresh || page === 1) {
          seenKeysRef.current = new Set(response.data.map(getItemKey));
          setItems(response.data);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }

        setPagination(response.pagination);
        currentPageRef.current = page;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
        console.error('[useInfiniteLoad] Failed to load:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [fetcher, params, pageSize, getItemKey]
  );

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNext || loadingRef.current) return;
    await loadPage(currentPageRef.current + 1);
  }, [pagination?.hasNext, loadPage]);

  const refresh = useCallback(async () => {
    seenKeysRef.current.clear();
    currentPageRef.current = 0;
    await loadPage(1, true);
  }, [loadPage]);

  const reset = useCallback(() => {
    setItems([]);
    setPagination(null);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    seenKeysRef.current.clear();
    currentPageRef.current = 0;
  }, []);

  // ============ Effects ============

  // Load on mount
  useEffect(() => {
    if (loadOnMount) {
      loadPage(1, true);
    }
  }, [loadOnMount]);

  // Reload when params change
  useEffect(() => {
    if (loadOnMount && currentPageRef.current > 0) {
      refresh();
    }
  }, [JSON.stringify(params)]);

  return {
    items,
    loading,
    loadingMore,
    error,
    pagination,
    hasMore: pagination?.hasNext ?? false,
    loadMore,
    refresh,
    reset,
  };
}

export default useInfiniteLoad;
