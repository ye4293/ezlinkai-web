'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { DateTimeRangePicker } from '@/components/datetime-range-picker';
import { ImageStat } from '@/lib/types/image';
import { LOG_OPTIONS } from '@/constants';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function ImageTable({
  data,
  totalData
}: {
  data: ImageStat[];
  totalData: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();

  // 根据角色权限过滤
  const filterColumns = columns.filter((item) => {
    // 只有管理员和超级管理员才能看到channel_id, username, user_id列
    if (!['username', 'channel_id', 'user_id'].includes(item.id as string)) {
      return true;
    }

    // 角色10和100是管理员和超级管理员
    const userRole = (session?.user as any)?.role;
    return [10, 100].includes(Number(userRole));
  });

  const {
    searchQuery,
    setSearchQuery,
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
    page,
    setPage,
    pageSize,
    setPageSize,
    isAnyFilterActive,
    resetFilters,
    dateTimeRange,
    setDateTimeRange
  } = useTableFilters();

  // 导出CSV功能
  const exportToCSV = React.useCallback(
    (data: ImageStat[], filename: string) => {
      const headers = [
        'Time',
        'Task ID',
        'Provider',
        'Model',
        'Status',
        'Mode',
        'User',
        'Channel ID',
        'Quota',
        'Store URL',
        'Fail Reason'
      ];

      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          [
            new Date(row.created_at * 1000).toISOString(),
            row.task_id || '',
            row.provider || '',
            row.model || '',
            row.status || '',
            row.mode || '',
            row.username || '',
            row.channel_id || '',
            row.quota || '',
            row.store_url || '',
            `"${(row.fail_reason || '').replace(/"/g, '""')}"`
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    []
  );

  // 导出当前页面数据
  const exportCurrentPage = React.useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    exportToCSV(data, `image-logs-page-${timestamp}.csv`);
  }, [data, exportToCSV]);

  // 导出全部数据
  const exportAllData = React.useCallback(async () => {
    try {
      // 构建API参数
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pagesize', '9999'); // 获取大量数据

      if (searchQuery) params.set('keyword', searchQuery);
      if (taskId) params.set('taskid', taskId);
      if (provider) params.set('provider', provider);
      if (modelName) params.set('model_name', modelName);
      if (channelId) params.set('channel_id', channelId);
      if (userName) params.set('username', userName);
      if (dateTimeRange?.from)
        params.set(
          'start_timestamp',
          String(Math.floor(dateTimeRange.from.getTime() / 1000))
        );
      if (dateTimeRange?.to)
        params.set(
          'end_timestamp',
          String(Math.floor(dateTimeRange.to.getTime() / 1000))
        );

      const userApi = [10, 100].includes((session?.user as any).role)
        ? `/api/image`
        : `/api/image/self`;

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${params}`;

      const res = await fetch(baseUrl, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`
        }
      });

      const { data: allData } = await res.json();
      const imageData: ImageStat[] = (allData && allData.list) || [];

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      exportToCSV(imageData, `image-logs-all-${timestamp}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [
    searchQuery,
    taskId,
    provider,
    modelName,
    channelId,
    userName,
    dateTimeRange,
    session,
    exportToCSV
  ]);

  // 当分页状态变化时，重新获取数据
  React.useEffect(() => {
    // 开发环境下添加调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Image页面分页状态变化:', { page, pageSize });
    }

    // 使用更高效的刷新策略
    const refreshData = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('触发Image页面数据刷新');
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
          searchKey="Search"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableSearch
          searchKey="Task ID"
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
        <DateTimeRangePicker
          value={dateTimeRange}
          onValueChange={(newRange) => {
            setDateTimeRange(newRange);
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              导出
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportCurrentPage}>
              <div className="flex flex-col gap-1">
                <span>导出当前页数据</span>
                <span className="text-xs text-muted-foreground">
                  当前页 {data.length} 条记录
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAllData}>
              <div className="flex flex-col gap-1">
                <span>导出全部符合条件的数据</span>
                <span className="text-xs text-muted-foreground">
                  包含所有筛选条件的完整数据
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        showColumnToggle={true}
      />
    </div>
  );
}
