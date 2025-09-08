'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { VideoStat } from '@/lib/types';
import { LOG_OPTIONS } from '@/constants';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

export default function VideoTable({
  data,
  totalData
}: {
  data: VideoStat[];
  totalData: number;
}) {
  const { data: session } = useSession();

  // 根据角色权限过滤
  const filterColumns = columns.filter((item) => {
    if (
      (session?.user as any).role === 1 &&
      ['username', 'channel_id', 'user_id'].includes(item.id as string)
    )
      return false;
    return true;
  });

  const {
    taskId,
    setTaskId,
    provider,
    setProvider,
    modelName,
    setModelName,
    channelId,
    setChannelId,
    userName,
    setUserName,
    isAnyFilterActive,
    resetFilters,
    setPage,
    dateRange,
    setDateRange
  } = useTableFilters();

  const table = useReactTable({
    data,
    columns: filterColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    enableRowSelection: true
  });

  return (
    <div className="space-y-4 ">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="Task Id"
          searchQuery={taskId}
          setSearchQuery={setTaskId}
          setPage={setPage}
        />
        <DataTableSearch
          searchKey="Provider"
          searchQuery={provider}
          setSearchQuery={setProvider}
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
        table={table}
        columns={filterColumns}
        data={data}
        totalItems={totalData}
      />
    </div>
  );
}
