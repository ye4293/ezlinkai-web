'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export const STATUS_OPTIONS = [
  { value: '1', label: 'Activated' },
  { value: '2', label: 'Disabled' }
];

export function useTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.status.withOptions({ shallow: false }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const refetchData = useCallback(async () => {
    // Force a URL params update which will trigger a new data fetch
    await Promise.all([
      setSearchQuery(searchQuery),
      setStatusFilter(statusFilter),
      setPage(page)
    ]);
  }, [
    searchQuery,
    statusFilter,
    page,
    setSearchQuery,
    setStatusFilter,
    setPage
  ]);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);

    setPage(1);
  }, [setSearchQuery, setStatusFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter;
  }, [searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    refetchData,
    resetFilters,
    isAnyFilterActive
  };
}
