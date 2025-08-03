'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSingleFilterBox } from '@/components/ui/table/data-table-single-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { LogStat } from '@/lib/types';
import { LOG_OPTIONS } from '@/constants';
import { columns } from './columns';
import { useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function LogTable({
  data,
  totalData
}: {
  data: LogStat[];
  totalData: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();

  // 根据角色权限过滤
  const filterColumns = columns.filter((item) => {
    if (
      (session?.user as any).role === 1 &&
      ['channel', 'content'].includes(item.id as string)
    )
      return false;
    return true;
  });

  const {
    tokenName,
    setTokenName,
    modelName,
    setModelName,
    channelId,
    setChannelId,
    userName,
    setUserName,
    typeFilter,
    setTypeFilter,
    isAnyFilterActive,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    dateRange,
    setDateRange
  } = useTableFilters();

  // 当分页状态变化时，重新获取数据
  React.useEffect(() => {
    // 开发环境下添加调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Log页面分页状态变化:', { page, pageSize });
    }

    // 使用更高效的刷新策略
    const refreshData = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('触发Log页面数据刷新');
      }
      router.refresh();
    };

    // 防抖机制：避免快速连续的状态变化
    const timeoutId = setTimeout(
      refreshData,
      process.env.NODE_ENV === 'development' ? 50 : 0
    );

    return () => clearTimeout(timeoutId);
  }, [page, pageSize, router]);

  // 处理页面大小变化，重置到第一页
  const handlePageSizeChange = React.useCallback(
    (newPageSize: number) => {
      // 使用 startTransition 来批量更新状态，避免多次触发useEffect
      React.startTransition(() => {
        setPageSize(newPageSize);
        setPage(1);
      });
    },
    [setPageSize, setPage]
  );

  return (
    <div className="space-y-4 ">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="Token Name"
          searchQuery={tokenName}
          setSearchQuery={setTokenName}
          setPage={setPage}
        />
        <DataTableSearch
          searchKey="Model Name"
          searchQuery={modelName}
          setSearchQuery={setModelName}
          setPage={setPage}
        />
        {[10, 100].includes((session?.user as any).role) && (
          <>
            <DataTableSearch
              searchKey="Channel ID"
              searchQuery={channelId}
              setSearchQuery={setChannelId}
              setPage={setPage}
            />
            <DataTableSearch
              searchKey="User Name"
              searchQuery={userName}
              setSearchQuery={setUserName}
              setPage={setPage}
            />
          </>
        )}
        <DataTableSingleFilterBox
          filterKey="type"
          title="Type"
          options={LOG_OPTIONS}
          setFilterValue={setTypeFilter}
          filterValue={typeFilter}
        />
        <CalendarDateRangePicker
          date={dateRange}
          onDateChange={(newDate) => {
            setDateRange(newDate);
            setPage(1);
          }}
        />
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={() => {
            resetFilters();
            setPage(1);
          }}
        />
      </div>
      <DataTable
        columns={filterColumns}
        data={data}
        totalItems={totalData}
        currentPage={page}
        pageSize={pageSize}
        setCurrentPage={setPage}
        setPageSize={handlePageSizeChange}
        pageSizeOptions={[10, 50, 100, 500]}
      />
    </div>
  );
}
