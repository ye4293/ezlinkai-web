'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
// import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { DateTimeRangePicker } from '@/components/datetime-range-picker';
import { VideoStat } from '@/lib/types/video';
import { LOG_OPTIONS } from '@/constants';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function VideoTable({
  data,
  totalData
}: {
  data: VideoStat[];
  totalData: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();

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
    page,
    setPage,
    pageSize,
    setPageSize,
    isAnyFilterActive,
    resetFilters,
    dateTimeRange,
    setDateTimeRange
  } = useTableFilters();

  // 本地状态
  const [localTaskId, setLocalTaskId] = useState(taskId || '');
  const [localProvider, setLocalProvider] = useState(provider || '');
  const [localModelName, setLocalModelName] = useState(modelName || '');
  const [localChannelId, setLocalChannelId] = useState(channelId || '');
  const [localUserName, setLocalUserName] = useState(userName || '');

  useEffect(() => {
    setLocalTaskId(taskId || '');
  }, [taskId]);
  useEffect(() => {
    setLocalProvider(provider || '');
  }, [provider]);
  useEffect(() => {
    setLocalModelName(modelName || '');
  }, [modelName]);
  useEffect(() => {
    setLocalChannelId(channelId || '');
  }, [channelId]);
  useEffect(() => {
    setLocalUserName(userName || '');
  }, [userName]);

  const handleSearch = () => {
    setPage(1);
    setTaskId(localTaskId || null);
    setProvider(localProvider || null);
    setModelName(localModelName || null);
    setChannelId(localChannelId || null);
    setUserName(localUserName || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 导出CSV功能
  const exportToCSV = React.useCallback(
    (data: VideoStat[], filename: string) => {
      const headers = [
        'Time',
        'Task ID',
        'Provider',
        'Model',
        'Type',
        'Mode',
        'Duration',
        'User',
        'Channel ID',
        'Status',
        'Fail Reason',
        'Store URL',
        'Quota',
        'N'
      ];

      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          [
            new Date(row.created_at * 1000).toISOString(),
            row.task_id || '',
            row.provider || '',
            row.model || '',
            row.type || '',
            row.mode || '',
            row.duration || '',
            row.username || '',
            row.channel_id || '',
            row.status || '',
            `"${(row.fail_reason || '').replace(/"/g, '""')}"`,
            row.store_url || '',
            ((row.quota || 0) / 500000).toFixed(6),
            row.n || ''
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
    exportToCSV(data, `video-logs-page-${timestamp}.csv`);
  }, [data, exportToCSV]);

  // 导出全部数据 - 高性能并行分批请求，支持百万级数据
  const exportAllData = React.useCallback(async () => {
    try {
      const allVideoData: VideoStat[] = [];
      const pageSizePerRequest = 10000; // 每次请求1万条
      const concurrentRequests = 10; // 10个并发请求

      const userApi = [10, 100].includes((session?.user as any).role)
        ? `/api/video`
        : `/api/video/self`;

      // 构建通用参数
      const buildParams = (page: number) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pagesize', String(pageSizePerRequest));

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

        return params;
      };

      // 请求单个页面的数据
      const fetchPage = async (page: number): Promise<VideoStat[]> => {
        const params = buildParams(page);
        const url =
          process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${params}`;

        const res = await fetch(url, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`
          }
        });

        const { data: responseData } = await res.json();
        return (responseData && responseData.list) || [];
      };

      console.log('🚀 开始导出视频数据...');

      // 第一次请求获取 total
      const firstList = await fetchPage(0);
      const firstParams = buildParams(0);
      const firstUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${firstParams}`;

      const firstRes = await fetch(firstUrl, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`
        }
      });

      const { data: firstData } = await firstRes.json();
      const total = firstData?.total || 0;

      if (firstList.length > 0) {
        allVideoData.push(...firstList);
      }

      console.log(`📊 总共 ${total} 条视频记录需要导出`);

      // 计算总页数
      const totalPages = Math.ceil(total / pageSizePerRequest);

      // 并行分批请求剩余数据
      for (let i = 1; i < totalPages; i += concurrentRequests) {
        const pagePromises: Promise<VideoStat[]>[] = [];

        // 创建并发请求
        for (let j = 0; j < concurrentRequests && i + j < totalPages; j++) {
          pagePromises.push(fetchPage(i + j));
        }

        // 等待当前批次完成
        const results = await Promise.all(pagePromises);

        // 合并数据
        results.forEach((pageData) => {
          if (pageData.length > 0) {
            allVideoData.push(...pageData);
          }
        });

        // 显示进度
        const progress = Math.min(100, Math.round((i / totalPages) * 100));
        console.log(
          `⏳ 导出进度: ${progress}% (${allVideoData.length}/${total})`
        );
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      exportToCSV(allVideoData, `video-logs-all-${timestamp}.csv`);

      console.log(
        `✅ 成功导出 ${allVideoData.length} 条视频记录（总计 ${total} 条）`
      );
      alert(`✅ 导出完成！共导出 ${allVideoData.length} 条视频记录`);
    } catch (error) {
      console.error('❌ 导出失败:', error);
      alert('导出失败，请查看控制台错误信息');
    }
  }, [
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
      console.log('Video页面分页状态变化:', { page, pageSize });
    }

    // 使用更高效的刷新策略
    const refreshData = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('触发Video页面数据刷新');
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
        <div className="relative min-w-[200px] flex-1">
          <Input
            placeholder="Search Task Id..."
            value={localTaskId}
            onChange={(e) => setLocalTaskId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-8"
          />
          {localTaskId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalTaskId('')}
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Input
            placeholder="Search Provider..."
            value={localProvider}
            onChange={(e) => setLocalProvider(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-8"
          />
          {localProvider && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalProvider('')}
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Input
            placeholder="Search Model Name..."
            value={localModelName}
            onChange={(e) => setLocalModelName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-8"
          />
          {localModelName && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalModelName('')}
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
