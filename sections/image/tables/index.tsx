'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
// import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { DateTimeRangePicker } from '@/components/datetime-range-picker';
import { ImageStat } from '@/lib/types/image';
import { LOG_OPTIONS } from '@/constants';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';

// 移动端图片卡片
const MobileImageCard = ({ item }: { item: ImageStat }) => {
  const getStatusColor = (status: string) => {
    if (status === 'success') return 'bg-green-100 text-green-800';
    if (status === 'failed') return 'bg-red-100 text-red-800';
    if (status === 'running') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="mb-4 overflow-hidden text-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="text-xs text-muted-foreground">
            {dayjs(Number(item.created_at || 0) * 1000).format(
              'YYYY-MM-DD HH:mm:ss'
            )}
          </div>
          <Badge
            variant="outline"
            className={getStatusColor(item.status || '')}
          >
            {item.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">User</span>
            <span className="truncate font-medium">{item.username}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Task ID</span>
            <span className="truncate font-mono text-xs" title={item.task_id}>
              {item.task_id?.substring(0, 10)}...
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Model</span>
          <span className="break-all font-medium">{item.model}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded bg-muted/30 p-2">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Provider</span>
            <span className="font-medium">{item.provider}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Mode</span>
            <span className="font-medium">{item.mode}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Quota</span>
            <span className="font-mono text-blue-600">
              ${((item.quota || 0) / 500000).toFixed(6)}
            </span>
          </div>
        </div>

        {item.store_url && (
          <div className="pt-1">
            <a
              href={item.store_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline"
            >
              View Generated Image
            </a>
          </div>
        )}

        {item.fail_reason && (
          <div className="break-all border-t pt-2 text-xs text-red-600">
            Error: {item.fail_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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

  // 本地状态
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [localTaskId, setLocalTaskId] = useState(taskId || '');
  const [localProvider, setLocalProvider] = useState(provider || '');
  const [localModelName, setLocalModelName] = useState(modelName || '');
  const [localChannelId, setLocalChannelId] = useState(channelId || '');
  const [localUserName, setLocalUserName] = useState(userName || '');

  // 查询加载状态
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setLocalSearchQuery(searchQuery || '');
  }, [searchQuery]);
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
    setIsSearching(true);
    setPage(1);
    setSearchQuery(localSearchQuery || null);
    setTaskId(localTaskId || null);
    setProvider(localProvider || null);
    setModelName(localModelName || null);
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

  // 导出全部数据 - 高性能并行分批请求，支持百万级数据
  const exportAllData = React.useCallback(async () => {
    try {
      const allImageData: ImageStat[] = [];
      const pageSizePerRequest = 10000; // 每次请求1万条
      const concurrentRequests = 10; // 10个并发请求

      const userApi = [10, 100].includes((session?.user as any).role)
        ? `/api/image`
        : `/api/image/self`;

      // 构建通用参数
      const buildParams = (page: number) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pagesize', String(pageSizePerRequest));

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

        return params;
      };

      // 请求单个页面的数据
      const fetchPage = async (page: number): Promise<ImageStat[]> => {
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

      console.log('🚀 开始导出图像数据...');

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
        allImageData.push(...firstList);
      }

      console.log(`📊 总共 ${total} 条图像记录需要导出`);

      // 计算总页数
      const totalPages = Math.ceil(total / pageSizePerRequest);

      // 并行分批请求剩余数据
      for (let i = 1; i < totalPages; i += concurrentRequests) {
        const pagePromises: Promise<ImageStat[]>[] = [];

        // 创建并发请求
        for (let j = 0; j < concurrentRequests && i + j < totalPages; j++) {
          pagePromises.push(fetchPage(i + j));
        }

        // 等待当前批次完成
        const results = await Promise.all(pagePromises);

        // 合并数据
        results.forEach((pageData) => {
          if (pageData.length > 0) {
            allImageData.push(...pageData);
          }
        });

        // 显示进度
        const progress = Math.min(100, Math.round((i / totalPages) * 100));
        console.log(
          `⏳ 导出进度: ${progress}% (${allImageData.length}/${total})`
        );
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      exportToCSV(allImageData, `image-logs-all-${timestamp}.csv`);

      console.log(
        `✅ 成功导出 ${allImageData.length} 条图像记录（总计 ${total} 条）`
      );
      alert(`✅ 导出完成！共导出 ${allImageData.length} 条图像记录`);
    } catch (error) {
      console.error('❌ 导出失败:', error);
      alert('导出失败，请查看控制台错误信息');
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="relative min-w-[200px]">
          <Input
            placeholder="Search..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-8"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative min-w-[200px]">
          <Input
            placeholder="Search Task ID..."
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
        <div className="relative min-w-[200px]">
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
        <div className="relative min-w-[200px]">
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
            <div className="relative min-w-[200px]">
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
            <div className="relative min-w-[200px]">
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
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="flex-1 gap-2 sm:flex-none"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="sm:inline">
              {isSearching ? 'Searching...' : 'Search'}
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2 sm:flex-none">
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
          <div className="flex items-center gap-2">
            <DataTableResetFilter
              isFilterActive={isAnyFilterActive}
              onReset={() => {
                resetFilters();
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="col-span-full flex justify-end">
          <DateTimeRangePicker
            value={dateTimeRange}
            onValueChange={(newRange) => {
              setDateTimeRange(newRange);
              setPage(1);
            }}
          />
        </div>
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

      {/* Desktop View */}
      <div className="hidden md:block">
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
          minWidth="1600px"
        />
      </div>

      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {data.map((item, index) => (
          <MobileImageCard key={item.task_id || index} item={item} />
        ))}
        {/* Mobile Pagination */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">Total {totalData}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="flex items-center px-2 text-sm">{page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={data.length < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
