'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
// import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
// import { Channel } from '@/constants/data';
import { MidjourneyStat } from '@/lib/types/midjourney';
import { LOG_OPTIONS } from '@/constants';
import { columns } from './columns';
import {
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  useTableFilters
} from './use-table-filters';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export default function MidjourneyTable({
  data,
  totalData
}: {
  data: MidjourneyStat[];
  totalData: number;
}) {
  const { data: session } = useSession();

  // // 根据角色权限过滤
  // const filterColumns = columns.filter((item) => {
  //   if (
  //     session.user.role === 1 &&
  //     ['channel', 'content'].includes(item.accessorKey)
  //   )
  //     return false;
  //   return true;
  // });

  const {
    mjId,
    setMjId,
    channelId,
    setChannelId,
    userName,
    setUserName,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    isAnyFilterActive,
    resetFilters,
    setPage,
    dateRange,
    setDateRange
  } = useTableFilters();

  const [localMjId, setLocalMjId] = useState(mjId || '');
  const [localChannelId, setLocalChannelId] = useState(channelId || '');
  const [localUserName, setLocalUserName] = useState(userName || '');

  useEffect(() => {
    setLocalMjId(mjId || '');
  }, [mjId]);

  useEffect(() => {
    setLocalChannelId(channelId || '');
  }, [channelId]);

  useEffect(() => {
    setLocalUserName(userName || '');
  }, [userName]);

  const handleSearch = () => {
    setPage(1);
    setMjId(localMjId || null);
    setChannelId(localChannelId || null);
    setUserName(localUserName || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 ">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Input
            placeholder="Search Task Id..."
            value={localMjId}
            onChange={(e) => setLocalMjId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-8"
          />
          {localMjId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalMjId('')}
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {[10, 100].includes((session?.user as any).role) && (
          <>
            <div className="relative min-w-[200px] flex-1">
              <Input
                placeholder="Search Channel ID..."
                value={localChannelId}
                onChange={(e) => setLocalChannelId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-8"
              />
              {localChannelId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalChannelId('')}
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="relative min-w-[200px] flex-1">
              <Input
                placeholder="Search User Name..."
                value={localUserName}
                onChange={(e) => setLocalUserName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-8"
              />
              {localUserName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalUserName('')}
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </>
        )}

        <Button onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </Button>

        <DataTableFilterBox
          filterKey="type"
          title="Type"
          options={TYPE_OPTIONS}
          setFilterValue={setTypeFilter}
          filterValue={typeFilter}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Status"
          options={STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
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
      <DataTable columns={columns} data={data} totalItems={totalData} />
    </div>
  );
}
