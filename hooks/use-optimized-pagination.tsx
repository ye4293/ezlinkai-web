'use client';

import { useCallback, useMemo, useRef, useTransition } from 'react';
import { useDebounce } from '@/lib/performance-utils';

interface UseOptimizedPaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  debounceMs?: number;
}

export function useOptimizedPagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  debounceMs = 300
}: UseOptimizedPaginationProps) {
  const [isPending, startTransition] = useTransition();
  const lastPageChangeRef = useRef<number>(Date.now());

  // 计算总页数
  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // 计算按钮状态
  const buttonStates = useMemo(
    () => ({
      canGoPrevious: currentPage > 1,
      canGoNext: currentPage < pageCount,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === pageCount
    }),
    [currentPage, pageCount]
  );

  // 防抖的页面变更函数
  const debouncedPageChange = useDebounce((page: number) => {
    if (page !== currentPage && page >= 1 && page <= pageCount) {
      startTransition(() => {
        onPageChange(page);
      });
    }
  }, debounceMs);

  // 优化的导航函数
  const goToFirstPage = useCallback(() => {
    if (!buttonStates.isFirstPage) {
      debouncedPageChange(1);
    }
  }, [buttonStates.isFirstPage, debouncedPageChange]);

  const goToPreviousPage = useCallback(() => {
    if (buttonStates.canGoPrevious) {
      debouncedPageChange(currentPage - 1);
    }
  }, [buttonStates.canGoPrevious, currentPage, debouncedPageChange]);

  const goToNextPage = useCallback(() => {
    if (buttonStates.canGoNext) {
      debouncedPageChange(currentPage + 1);
    }
  }, [buttonStates.canGoNext, currentPage, debouncedPageChange]);

  const goToLastPage = useCallback(() => {
    if (!buttonStates.isLastPage) {
      debouncedPageChange(pageCount);
    }
  }, [buttonStates.isLastPage, pageCount, debouncedPageChange]);

  const goToPage = useCallback(
    (page: number) => {
      debouncedPageChange(page);
    },
    [debouncedPageChange]
  );

  // 优化的页面大小变更函数
  const changePageSize = useCallback(
    (newSize: number) => {
      if (newSize !== pageSize && newSize > 0) {
        startTransition(() => {
          // 计算新的页面索引，尽量保持当前数据的可见性
          const currentFirstItem = (currentPage - 1) * pageSize + 1;
          const newPage = Math.max(1, Math.ceil(currentFirstItem / newSize));

          onPageSizeChange(newSize);
          if (newPage !== currentPage) {
            onPageChange(newPage);
          }
        });
      }
    },
    [pageSize, currentPage, onPageSizeChange, onPageChange]
  );

  // 计算显示信息
  const displayInfo = useMemo(() => {
    if (totalItems === 0) {
      return {
        start: 0,
        end: 0,
        total: 0,
        text: 'No entries found'
      };
    }

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return {
      start,
      end,
      total: totalItems,
      text: `Showing ${start} to ${end} of ${totalItems} entries`
    };
  }, [currentPage, pageSize, totalItems]);

  // 生成页码数组（用于页码导航）
  const pageNumbers = useMemo(() => {
    const delta = 2; // 当前页前后显示的页数
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(pageCount - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < pageCount - 1) {
      rangeWithDots.push('...', pageCount);
    } else if (pageCount > 1) {
      rangeWithDots.push(pageCount);
    }

    return rangeWithDots;
  }, [currentPage, pageCount]);

  // 性能指标
  const performanceMetrics = useMemo(() => {
    const now = Date.now();
    const timeSinceLastChange = now - lastPageChangeRef.current;

    return {
      isPending,
      timeSinceLastChange,
      isFrequentlyChanging: timeSinceLastChange < 1000
    };
  }, [isPending]);

  return {
    // 状态
    currentPage,
    pageSize,
    pageCount,
    totalItems,
    isPending,

    // 按钮状态
    ...buttonStates,

    // 导航函数
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    goToPage,
    changePageSize,

    // 显示信息
    displayInfo,
    pageNumbers,

    // 性能指标
    performanceMetrics
  };
}
