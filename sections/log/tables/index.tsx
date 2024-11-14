'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
// import { Channel } from '@/constants/data';
import { Channel } from '@/lib/types';
import { LOG_OPTIONS } from '@/constants';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';

export default function LogTable({
  data,
  totalData
}: {
  data: Channel[];
  totalData: number;
}) {
  const { data: session } = useSession();

  // 根据角色权限过滤
  const filterColumns = columns.filter((item) => {
    if (
      session.user.role === 1 &&
      ['channel', 'content'].includes(item.accessorKey)
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
    // statusFilter,
    // setStatusFilter,
    typeFilter,
    setTypeFilter,
    isAnyFilterActive,
    resetFilters,
    setPage,
    dateRange,
    setDateRange
  } = useTableFilters();

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
        {/* <DataTableFilterBox
          filterKey="status"
          title="Status"
          options={STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        /> */}
        <DataTableFilterBox
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
      <DataTable columns={filterColumns} data={data} totalItems={totalData} />
    </div>
  );
}