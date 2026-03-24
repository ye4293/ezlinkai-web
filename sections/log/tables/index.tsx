'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSingleFilterBox } from '@/components/ui/table/data-table-single-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
// import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { DateTimeRangePicker } from '@/components/datetime-range-picker';
import { LogStat } from '@/lib/types/log';
import { LOG_OPTIONS } from '@/constants';
import {
  columns,
  formatTokenSpeed,
  getTokenSpeedValue,
  getSpeedTier,
  getDurationTier,
  parseUsageDetails,
  parseLogOther,
  usageDetailsLabels,
  UsageDetails,
  getModelMappingInfo
} from './columns';
import { useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useScreenSize } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Download,
  Search,
  X,
  Loader2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Row } from '@tanstack/react-table';
import dayjs from 'dayjs';

// 解析 adminInfo 获取渠道信息
const parseAdminInfo = (log: LogStat): number[] | null => {
  const parsed = parseLogOther(log);
  if (parsed) {
    const info = parsed.admin_info || parsed.adminInfo;
    if (Array.isArray(info) && info.length > 0) return info;
  }
  return null;
};

// 处理配额
const processQuota = (quota: number) => {
  const processedQuota = (quota / 500000).toFixed(6);
  return `$${parseFloat(processedQuota)}`;
};

// 获取有效的 usageDetails 条目（值大于0的）
const getUsageEntries = (details: UsageDetails | null) => {
  if (!details) return [];
  return Object.entries(details)
    .filter(([_, value]) => value !== undefined && value > 0)
    .map(([key, value]) => ({
      key,
      label: usageDetailsLabels[key] || key,
      value: value as number
    }));
};

// 展开行详情组件
const ExpandedRowContent = ({ row }: { row: Row<LogStat> }) => {
  const log = row.original;
  const usageDetails = parseUsageDetails(log);
  const channelIds = parseAdminInfo(log);

  const usageEntries = getUsageEntries(usageDetails);
  const hasUsageDetails = usageEntries.length > 0;
  const hasChannelInfo = channelIds && channelIds.length > 0;

  return (
    <div className="px-6 py-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 渠道信息 */}
        {hasChannelInfo && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              渠道信息
            </span>
            <p className="text-sm font-medium">
              {channelIds!.length === 1
                ? `${channelIds![0]}`
                : channelIds!.join(' → ')}
            </p>
          </div>
        )}

        {/* 基础 Token 信息 */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            提示Token
          </span>
          <p className="text-sm font-medium">{log.prompt_tokens} tokens</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            补全Token
          </span>
          <p className="text-sm font-medium">{log.completion_tokens} tokens</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            生成速率
          </span>
          {(() => {
            const sv = getTokenSpeedValue(log);
            return sv > 0 ? (
              <p
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-medium ring-1 ring-inset ${getSpeedTier(
                  sv
                )}`}
              >
                {formatTokenSpeed(log)}
              </p>
            ) : (
              <p className="text-sm font-medium">-</p>
            );
          })()}
        </div>

        {/* usageDetails 详细信息 */}
        {usageEntries.map(({ key, label, value }) => (
          <div key={key} className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <p className="text-sm font-medium">
              {value.toLocaleString()} tokens
            </p>
          </div>
        ))}

        {/* 配额信息 */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            花费
          </span>
          <p className="text-sm font-medium text-blue-600">
            {processQuota(log.quota)}
          </p>
        </div>

        {/* 请求相关信息 */}
        {log.x_request_id && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              X-Request-ID
            </span>
            <p className="break-all font-mono text-xs">{log.x_request_id}</p>
          </div>
        )}

        {log.x_response_id && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              X-Response-ID
            </span>
            <p className="break-all font-mono text-xs">{log.x_response_id}</p>
          </div>
        )}
      </div>

      {/* 详情内容 */}
      {log.content && (
        <div className="mt-4 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            日志详情
          </span>
          <p className="mt-1 whitespace-pre-wrap text-sm">{log.content}</p>
        </div>
      )}
    </div>
  );
};

// 移动端卡片组件
const MobileLogCard = ({ row }: { row: LogStat }) => {
  const log = row;
  const [isExpanded, setIsExpanded] = useState(false);
  const usageDetails = parseUsageDetails(log);
  const usageEntries = getUsageEntries(usageDetails);
  const hasUsageDetails = usageEntries.length > 0;

  const renderType = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="outline">Top up</Badge>;
      case 2:
        return <Badge variant="outline">Consumption</Badge>;
      case 3:
        return <Badge variant="outline">Management</Badge>;
      case 4:
        return <Badge variant="outline">System</Badge>;
      case 5:
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="mb-4 overflow-hidden text-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="text-xs text-muted-foreground">
            {dayjs(Number(log.created_at || 0) * 1000).format(
              'YYYY-MM-DD HH:mm:ss'
            )}
          </div>
          <div>{renderType(log.type || 0)}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">User</span>
            <span className="truncate font-medium">{log.username}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Channel ID</span>
            <span className="font-medium">{log.channel}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Model</span>
          {(() => {
            const mappingInfo = getModelMappingInfo(log);
            if (mappingInfo) {
              return (
                <div className="flex items-center gap-1 text-sm">
                  <span className="break-all font-medium">
                    {log.model_name}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary" className="text-xs">
                    {mappingInfo.upstreamModelName}
                  </Badge>
                </div>
              );
            }
            return (
              <span className="break-all font-medium">{log.model_name}</span>
            );
          })()}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded bg-muted/30 p-2">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Prompt</span>
            <span className="font-mono">{log.prompt_tokens}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Completion</span>
            <span className="font-mono">{log.completion_tokens}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Speed</span>
            {(() => {
              const sv = getTokenSpeedValue(log);
              return sv > 0 ? (
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-medium ring-1 ring-inset ${getSpeedTier(
                    sv
                  )}`}
                >
                  {formatTokenSpeed(log)}
                </span>
              ) : (
                <span className="font-mono">-</span>
              );
            })()}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Quota</span>
            <span className="font-mono text-blue-600">
              ${((log.quota || 0) / 500000).toFixed(6)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Duration:</span>
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getDurationTier(
                log.duration
              )}`}
            >
              {log.duration}s
            </span>
            {log.is_stream && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Stream
              </Badge>
            )}
          </div>
        </div>

        {log.x_request_id && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">X-Request-ID</span>
            <span className="truncate font-mono text-xs">
              {log.x_request_id}
            </span>
          </div>
        )}

        {/* 可展开的详细信息 */}
        {(hasUsageDetails || log.content) && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="text-xs">
                  {isExpanded ? '收起详情' : '展开详情'}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* usageDetails 详细信息 */}
              {hasUsageDetails && (
                <div className="grid grid-cols-2 gap-2 rounded bg-muted/50 p-3">
                  {usageEntries.map(({ key, label, value }) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                      <span className="font-mono text-sm">
                        {value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 日志内容 */}
              {log.content && (
                <div className="break-all border-t pt-2 text-xs text-muted-foreground">
                  {log.content}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

export default function LogTable({
  data,
  totalData
}: {
  data: LogStat[];
  totalData: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isMobile, isTablet } = useScreenSize();

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
    xRequestId,
    setXRequestId,
    xResponseId,
    setXResponseId,
    typeFilter,
    setTypeFilter,
    isAnyFilterActive,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    dateTimeRange,
    setDateTimeRange
  } = useTableFilters();

  // 本地状态用于输入框
  const [localTokenName, setLocalTokenName] = useState(tokenName || '');
  const [localModelName, setLocalModelName] = useState(modelName || '');
  const [localChannelId, setLocalChannelId] = useState(channelId || '');
  const [localUserName, setLocalUserName] = useState(userName || '');
  const [localXRequestId, setLocalXRequestId] = useState(xRequestId || '');
  const [localXResponseId, setLocalXResponseId] = useState(xResponseId || '');

  // 查询加载状态
  const [isSearching, setIsSearching] = useState(false);

  // 同步 URL 参数到本地状态
  useEffect(() => {
    setLocalTokenName(tokenName || '');
  }, [tokenName]);
  useEffect(() => {
    setLocalModelName(modelName || '');
  }, [modelName]);
  useEffect(() => {
    setLocalChannelId(channelId || '');
  }, [channelId]);
  useEffect(() => {
    setLocalUserName(userName || '');
  }, [userName]);
  useEffect(() => {
    setLocalXRequestId(xRequestId || '');
  }, [xRequestId]);
  useEffect(() => {
    setLocalXResponseId(xResponseId || '');
  }, [xResponseId]);

  // 统一搜索处理函数
  const handleSearch = () => {
    setIsSearching(true);
    setPage(1);
    setTokenName(localTokenName || null);
    setModelName(localModelName || null);
    setChannelId(localChannelId || null);
    setUserName(localUserName || null);
    setXRequestId(localXRequestId || null);
    setXResponseId(localXResponseId || null);

    // 强制刷新数据
    router.refresh();
  };

  // 处理回车键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 导出CSV功能
  const exportToCSV = React.useCallback((data: LogStat[], filename: string) => {
    const headers = [
      'Time',
      'Channel',
      'User',
      'Token',
      'Type',
      'Model',
      'Prompt Tokens',
      'Completion Tokens',
      'Speed (t/s)',
      'Quota',
      'Duration',
      'X-Request-ID',
      'X-Response-ID',
      'Details'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map((row) => {
        const tokenSpeed = getTokenSpeedValue(row);

        return [
          new Date(row.created_at * 1000).toISOString(),
          row.channel || '',
          row.username || '',
          row.token_name || '',
          row.type,
          row.model_name || '',
          row.prompt_tokens,
          row.completion_tokens,
          tokenSpeed > 0 ? tokenSpeed.toFixed(2) : '',
          row.quota,
          row.duration,
          row.x_request_id || '',
          row.x_response_id || '',
          `"${(row.content || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  // 导出当前页面数据
  const exportCurrentPage = React.useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    exportToCSV(data, `logs-page-${page}-${timestamp}.csv`);
  }, [data, page, exportToCSV]);

  // 导出全部数据 - 高性能并行分批请求，支持百万级数据
  const exportAllData = React.useCallback(async () => {
    try {
      const allLogData: LogStat[] = [];
      const pageSizePerRequest = 10000; // 每次请求1万条
      const concurrentRequests = 10; // 10个并发请求

      const userApi = [10, 100].includes((session?.user as any).role)
        ? `/api/log/`
        : `/api/log/self`;

      // 构建通用参数
      const buildParams = (page: number) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pagesize', String(pageSizePerRequest));

        if (tokenName) params.set('token_name', tokenName);
        if (modelName) params.set('model_name', modelName);
        if (channelId) params.set('channel', channelId);
        if (userName) params.set('username', userName);
        if (xRequestId) params.set('x_request_id', xRequestId);
        if (xResponseId) params.set('x_response_id', xResponseId);
        if (typeFilter) params.set('type', typeFilter);
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
      const fetchPage = async (page: number): Promise<LogStat[]> => {
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

      console.log('🚀 开始导出数据...');

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
        allLogData.push(...firstList);
      }

      console.log(`📊 总共 ${total} 条记录需要导出`);

      // 计算总页数
      const totalPages = Math.ceil(total / pageSizePerRequest);

      // 并行分批请求剩余数据
      for (let i = 1; i < totalPages; i += concurrentRequests) {
        const pagePromises: Promise<LogStat[]>[] = [];

        // 创建并发请求
        for (let j = 0; j < concurrentRequests && i + j < totalPages; j++) {
          pagePromises.push(fetchPage(i + j));
        }

        // 等待当前批次完成
        const results = await Promise.all(pagePromises);

        // 合并数据
        results.forEach((pageData) => {
          if (pageData.length > 0) {
            allLogData.push(...pageData);
          }
        });

        // 显示进度
        const progress = Math.min(100, Math.round((i / totalPages) * 100));
        console.log(
          `⏳ 导出进度: ${progress}% (${allLogData.length}/${total})`
        );
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      exportToCSV(allLogData, `logs-all-${timestamp}.csv`);

      console.log(
        `✅ 成功导出 ${allLogData.length} 条日志记录（总计 ${total} 条）`
      );
      alert(`✅ 导出完成！共导出 ${allLogData.length} 条记录`);
    } catch (error) {
      console.error('❌ 导出失败:', error);
      alert('导出失败，请查看控制台错误信息');
    }
  }, [
    tokenName,
    modelName,
    channelId,
    userName,
    xRequestId,
    xResponseId,
    typeFilter,
    dateTimeRange,
    session,
    exportToCSV
  ]);

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

  // 数据变化时关闭加载状态
  React.useEffect(() => {
    if (isSearching) {
      setIsSearching(false);
    }
  }, [data]);

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
      {/* 移动端优化的筛选器布局 */}
      <div className="space-y-4">
        {/* 第一行：主要搜索和导出 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="relative min-w-0 flex-1 sm:min-w-[200px] sm:flex-none">
            <Input
              placeholder="Search Token Name..."
              value={localTokenName}
              onChange={(e) => setLocalTokenName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8"
            />
            {localTokenName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalTokenName('')}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="relative min-w-0 flex-1 sm:min-w-[200px] sm:flex-none">
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

          {/* 统一查询按钮 */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSearching ? 'Searching...' : 'Search'}
              </span>
            </Button>
          </div>

          <div className="flex-shrink-0">
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 text-xs sm:text-sm"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>导出数据</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
        </div>

        {/* 第二行：高级搜索（可折叠） */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="relative min-w-0 flex-1 sm:min-w-[180px] sm:flex-none">
            <Input
              placeholder="Search X-Request-ID..."
              value={localXRequestId}
              onChange={(e) => setLocalXRequestId(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8"
            />
            {localXRequestId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalXRequestId('')}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="relative min-w-0 flex-1 sm:min-w-[180px] sm:flex-none">
            <Input
              placeholder="Search X-Response-ID..."
              value={localXResponseId}
              onChange={(e) => setLocalXResponseId(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8"
            />
            {localXResponseId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalXResponseId('')}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {[10, 100].includes((session?.user as any).role) && (
            <>
              <div className="relative min-w-0 flex-1 sm:min-w-[180px] sm:flex-none">
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
              <div className="relative min-w-0 flex-1 sm:min-w-[180px] sm:flex-none">
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
        </div>

        {/* 第三行：过滤器和时间选择 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex-shrink-0">
            <DataTableSingleFilterBox
              filterKey="type"
              title="Type"
              options={LOG_OPTIONS}
              setFilterValue={setTypeFilter}
              filterValue={typeFilter}
            />
          </div>
          <div className="min-w-0 flex-1">
            <DateTimeRangePicker
              value={dateTimeRange}
              onValueChange={(newRange) => {
                setDateTimeRange(newRange);
                setPage(1);
              }}
            />
          </div>
          <div className="flex-shrink-0">
            <DataTableResetFilter
              isFilterActive={isAnyFilterActive}
              onReset={() => {
                resetFilters();
                setPage(1);
                // 本地状态也会因为 useEffect 自动重置，因为 resetFilters 会重置 URL 参数
              }}
            />
          </div>
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
          initialColumnVisibility={{
            // 默认隐藏的列
            x_request_id: true,
            x_response_id: false,
            // 根据屏幕尺寸智能隐藏列
            ...(isMobile
              ? {
                  // 移动端：只显示最重要的列
                  channel: false,
                  prompt_tokens: false,
                  completion_tokens: false,
                  duration: false,
                  retry: false,
                  content: false
                }
              : isTablet
              ? {
                  // 平板端：隐藏部分次要列
                  prompt_tokens: false,
                  completion_tokens: false,
                  retry: false,
                  content: false
                }
              : {})
          }}
          minWidth="1000px"
          renderExpandedRow={(row) => (
            <ExpandedRowContent row={row as Row<LogStat>} />
          )}
        />
      </div>

      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {data.length > 0 ? (
          data.map((row, index) => <MobileLogCard key={index} row={row} />)
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            No results found.
          </div>
        )}

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
