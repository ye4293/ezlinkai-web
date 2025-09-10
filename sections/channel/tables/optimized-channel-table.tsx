'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { ChannelTable } from './channel-table';
import { columns } from './columns';
import { Channel } from '@/lib/types';
import { useChannelData } from '../hooks/use-channel-data';
import { useTableFilters } from './use-table-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedChannelTableProps {
  initialData?: Channel[];
  initialTotal?: number;
}

const OptimizedChannelTable = memo(
  ({ initialData = [], initialTotal = 0 }: OptimizedChannelTableProps) => {
    const {
      searchQuery,
      statusFilter,
      page,
      pageSize,
      resetFilters,
      isAnyFilterActive
    } = useTableFilters();

    const {
      data: channels,
      total,
      loading,
      error,
      refetch
    } = useChannelData({
      page,
      pageSize,
      keyword: searchQuery,
      status: statusFilter
    });

    // 使用初始数据作为后备，避免首次加载闪烁
    const displayData = useMemo(() => {
      if (loading && channels.length === 0) {
        return initialData;
      }
      return channels;
    }, [channels, initialData, loading]);

    const displayTotal = useMemo(() => {
      if (loading && total === 0) {
        return initialTotal;
      }
      return total;
    }, [total, initialTotal, loading]);

    // 计算页面数量
    const pageCount = Math.ceil(displayTotal / pageSize);

    // 错误处理
    if (error) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p>加载失败: {error}</p>
              <button
                onClick={refetch}
                className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                重试
              </button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 加载状态
    if (loading && displayData.length === 0) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* 过滤器重置按钮 */}
        {isAnyFilterActive && (
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              清除筛选条件
            </button>
          </div>
        )}

        {/* 加载指示器 */}
        {loading && displayData.length > 0 && (
          <div className="py-2 text-center">
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
              <svg
                className="-ml-1 mr-2 h-3 w-3 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              更新中...
            </div>
          </div>
        )}

        {/* 数据表格 */}
        <ChannelTable
          columns={columns}
          data={displayData}
          searchKey="name"
          pageNo={page}
          totalUsers={displayTotal}
          pageCount={pageCount}
        />
      </div>
    );
  }
);

OptimizedChannelTable.displayName = 'OptimizedChannelTable';

export default OptimizedChannelTable;
