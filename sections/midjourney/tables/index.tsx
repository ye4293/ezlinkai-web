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
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';

export default function MidjourneyTable({
  data,
  totalData
}: {
  data: MidjourneyStat[];
  totalData: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();

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

  // 查询加载状态
  const [isSearching, setIsSearching] = useState(false);

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
    setIsSearching(true);
    setPage(1);
    setMjId(localMjId || null);
    setChannelId(localChannelId || null);
    setUserName(localUserName || null);

    // 强制刷新数据
    router.refresh();
  };

  // 数据变化时关闭加载状态
  React.useEffect(() => {
    if (isSearching) {
      setIsSearching(false);
    }
  }, [data]);

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

        <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isSearching ? 'Searching...' : 'Search'}
          </span>
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

      {/* 查询加载遮罩 */}
      {isSearching && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative duration-200 animate-in zoom-in-50">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white shadow-2xl">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">正在查询...</span>
            </div>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={data} totalItems={totalData} />
    </div>
  );
}
