'use client';
import {
  ColumnDef,
  PaginationState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  useReactTable,
  Row
} from '@tanstack/react-table';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogStat } from '@/lib/types/log';
import dayjs from 'dayjs';
import {
  parseUsageDetails,
  parseBillingDetails,
  parseLogOther,
  getUsageDetailsLabels,
  UsageDetails,
  BillingDetails
} from './columns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { useLocale } from '@/components/providers/locale-provider';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string;
  pageNo: number;
  totalUsers: number;
  pageSizeOptions?: number[];
  pageCount: number;
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

// 解析 adminInfo 获取渠道信息
const parseAdminInfo = (log: LogStat): number[] | null => {
  const parsed = parseLogOther(log);
  if (parsed) {
    const info = parsed.admin_info || parsed.adminInfo;
    if (Array.isArray(info) && info.length > 0) return info;
  }
  return null;
};

// 展开行详情组件
const ExpandedRowContent = ({ row }: { row: Row<LogStat> }) => {
  const { t } = useLocale();
  const ld = t.logDetail;
  const log = row.original;
  const usageDetails = parseUsageDetails(log);
  const billingDetails = parseBillingDetails(log);
  const channelIds = parseAdminInfo(log);
  const labels = getUsageDetailsLabels(ld);

  // 处理配额
  const processQuota = (quota: number) => {
    const processedQuota = (quota / 500000).toFixed(6);
    return `$${parseFloat(processedQuota)}`;
  };

  // 计算模型价格（每 1M tokens 的美元价格）
  const getTokenPrice = (ratio: number) => {
    // modelRatio * 2 = 每 1M tokens 的价格（美元）
    return ratio * 2;
  };

  // 获取有效的 usageDetails 条目（值大于0的）
  const getUsageEntries = (details: UsageDetails | null) => {
    if (!details) return [];
    return Object.entries(details)
      .filter(([_, value]) => value !== undefined && value > 0)
      .map(([key, value]) => ({
        key,
        label: labels[key] || key,
        value: value as number
      }));
  };

  const usageEntries = getUsageEntries(usageDetails);
  const hasUsageDetails = usageEntries.length > 0;
  const hasChannelInfo = channelIds && channelIds.length > 0;
  const hasBillingDetails = billingDetails !== null;

  // Claude 缓存计费行：tokens 来自 usageDetails，ratio 来自 billingDetails
  // 只有 ratio 存在且对应 tokens > 0 时才展示。老日志（无 ratio 字段）自动跳过。
  type CacheLine = {
    key: string;
    tokens: number;
    pricePerMillion: number;
    perMillionLabel: string;
  };
  const claudeCacheLines: CacheLine[] = (() => {
    if (!billingDetails || billingDetails.billing_type !== 'token') return [];
    const modelRatio = billingDetails.model_ratio || 0;
    const lines: CacheLine[] = [];
    const push = (
      key: string,
      tokens: number | undefined,
      ratio: number | undefined,
      perMillionLabel: string
    ) => {
      if (!tokens || tokens <= 0 || !ratio) return;
      lines.push({
        key,
        tokens,
        pricePerMillion: getTokenPrice(modelRatio * ratio),
        perMillionLabel
      });
    };
    push(
      'cache_5m',
      usageDetails?.claude_cache_creation_5_m_tokens,
      billingDetails.claude_cache_5m_ratio,
      ld.perMillionCache5m
    );
    push(
      'cache_1h',
      usageDetails?.claude_cache_creation_1_h_tokens,
      billingDetails.claude_cache_1h_ratio,
      ld.perMillionCache1h
    );
    push(
      'cache_read',
      usageDetails?.cache_read_input_tokens,
      billingDetails.claude_cache_read_ratio,
      ld.perMillionCacheRead
    );
    return lines;
  })();

  return (
    <div className="bg-muted/30 px-6 py-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 渠道信息 */}
        {hasChannelInfo && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {ld.channelInfo}
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
            {ld.promptTokens}
          </span>
          <p className="text-sm font-medium">{log.prompt_tokens} tokens</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {ld.completionTokens}
          </span>
          <p className="text-sm font-medium">{log.completion_tokens} tokens</p>
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
            {ld.cost}
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

      {/* 计费详情 */}
      {hasBillingDetails && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {/* 计费模式 */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {ld.billingMode}
            </span>
            <p className="text-sm font-medium">
              {billingDetails.billing_type === 'fixed_price'
                ? ld.fixedPrice
                : ld.tokenBilling}
            </p>
          </div>

          {/* 模型价格 */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {ld.modelPrice}
            </span>
            <div className="text-sm">
              {billingDetails.billing_type === 'fixed_price' ? (
                <p className="font-medium">
                  ${billingDetails.model_price?.toFixed(2)} {ld.perRequest}
                </p>
              ) : (
                <div className="space-y-0.5">
                  <p>
                    <span className="font-medium">
                      $
                      {getTokenPrice(billingDetails.model_ratio || 0).toFixed(
                        6
                      )}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {ld.perMillionInput}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">
                      $
                      {getTokenPrice(
                        (billingDetails.model_ratio || 0) *
                          (billingDetails.completion_ratio || 1)
                      ).toFixed(6)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {ld.perMillionOutput}
                    </span>
                  </p>
                  {billingDetails.cached_tokens &&
                    billingDetails.cached_tokens > 0 && (
                      <p>
                        <span className="font-medium">
                          $
                          {getTokenPrice(
                            billingDetails.cache_ratio || 0
                          ).toFixed(6)}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {ld.perMillionCached}
                        </span>
                      </p>
                    )}
                  {claudeCacheLines.map((line) => (
                    <p key={line.key}>
                      <span className="font-medium">
                        ${line.pricePerMillion.toFixed(6)}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        {line.perMillionLabel}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 计费过程 */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {ld.billingProcess}
            </span>
            <div className="rounded bg-muted/50 p-2 font-mono text-xs">
              {billingDetails.billing_type === 'fixed_price' ? (
                <p>
                  ${billingDetails.model_price?.toFixed(2)} ×{' '}
                  {billingDetails.group_ratio?.toFixed(2)} ({ld.groupRatio}) ={' '}
                  {processQuota(log.quota)}
                </p>
              ) : (
                <>
                  <p>
                    ({log.prompt_tokens.toLocaleString()} tokens × $
                    {getTokenPrice(billingDetails.model_ratio || 0).toFixed(6)}
                    /1M + {log.completion_tokens.toLocaleString()} tokens × $
                    {getTokenPrice(
                      (billingDetails.model_ratio || 0) *
                        (billingDetails.completion_ratio || 1)
                    ).toFixed(6)}
                    /1M
                    {claudeCacheLines.map((line) => (
                      <React.Fragment key={line.key}>
                        {' + '}
                        {line.tokens.toLocaleString()} tokens × $
                        {line.pricePerMillion.toFixed(6)}/1M
                      </React.Fragment>
                    ))}
                    ) × {billingDetails.group_ratio?.toFixed(2)} ={' '}
                    {processQuota(log.quota)}
                  </p>
                  {billingDetails.cached_tokens &&
                    billingDetails.cached_tokens > 0 && (
                      <p className="mt-1 text-muted-foreground">
                        {ld.cachedTokens}:{' '}
                        {billingDetails.cached_tokens.toLocaleString()} tokens
                      </p>
                    )}
                </>
              )}
              <p className="mt-1 italic text-muted-foreground">
                {ld.referenceOnly}
              </p>
            </div>
          </div>

          {/* 折扣分量拆分（等级/渠道/用户渠道） */}
          {(billingDetails.tier_ratio !== undefined ||
            billingDetails.channel_discount !== undefined ||
            billingDetails.user_channel_ratio !== undefined) && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {ld.discountBreakdown}
              </span>
              <div className="grid grid-cols-3 gap-2 rounded bg-muted/50 p-2 text-xs">
                <div>
                  <p className="text-muted-foreground">{ld.tierRatio}</p>
                  <p className="font-mono font-medium">
                    {(billingDetails.tier_ratio ?? 1).toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{ld.channelDiscount}</p>
                  <p className="font-mono font-medium">
                    {(billingDetails.channel_discount ?? 1).toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {ld.userChannelDiscount}
                  </p>
                  <p className="font-mono font-medium">
                    {(billingDetails.user_channel_ratio ?? 1).toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 多 Key 渠道：本次使用的 Key 索引 */}
          {billingDetails.is_multi_key &&
            billingDetails.key_index !== undefined && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {ld.keyIndex}
                </span>
                <p className="font-mono text-sm">#{billingDetails.key_index}</p>
              </div>
            )}
        </div>
      )}

      {/* 详情内容 */}
      {log.content && !hasBillingDetails && (
        <div className="mt-4 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            {ld.logContent}
          </span>
          <p className="mt-1 whitespace-pre-wrap text-sm">{log.content}</p>
        </div>
      )}
    </div>
  );
};

// 移动端卡片组件
const MobileLogCard = ({ row }: { row: Row<LogStat> }) => {
  const { t } = useLocale();
  const ld = t.logDetail;
  const log = row.original;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const usageDetails = parseUsageDetails(log);
  const labels = getUsageDetailsLabels(ld);

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

  // 获取有效的 usageDetails 条目
  const getUsageEntries = (details: UsageDetails | null) => {
    if (!details) return [];
    return Object.entries(details)
      .filter(([_, value]) => value !== undefined && value > 0)
      .map(([key, value]) => ({
        key,
        label: labels[key] || key,
        value: value as number
      }));
  };

  const usageEntries = getUsageEntries(usageDetails);
  const hasUsageDetails = usageEntries.length > 0;

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
          <span className="break-all font-medium">{log.model_name}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded bg-muted/30 p-2">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Prompt</span>
            <span className="font-mono">{log.prompt_tokens}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Completion</span>
            <span className="font-mono">{log.completion_tokens}</span>
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
            <span>{log.duration}s</span>
            {log.is_stream && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Stream
              </Badge>
            )}
          </div>
        </div>

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
                  {isExpanded ? ld.collapse : ld.expand}
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

export function LogTable<TData, TValue>({
  columns,
  data,
  pageNo,
  searchKey,
  totalUsers,
  pageCount,
  pageSizeOptions = [10, 20, 30, 40, 50]
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Search params
  const page = searchParams?.get('page') ?? '1';
  const pageAsNumber = Number(page);
  const fallbackPage =
    isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;
  const per_page = searchParams?.get('limit') ?? '10';
  const perPageAsNumber = Number(per_page);
  const fallbackPerPage = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;

  /* this can be used to get the selectedrows 
  console.log("value", table.getFilteredSelectedRowModel()); */

  // Create query string
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: fallbackPage - 1,
      pageSize: fallbackPerPage
    });

  // 展开状态管理
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  React.useEffect(() => {
    router.push(
      `${pathname}?${createQueryString({
        page: pageIndex + 1,
        limit: pageSize
      })}`,
      {
        scroll: false
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      pagination: { pageIndex, pageSize },
      expanded
    },
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    getRowCanExpand: () => true
  });

  const searchValue = table.getColumn(searchKey)?.getFilterValue() as string;

  React.useEffect(() => {
    if (searchValue?.length > 0) {
      router.push(
        `${pathname}?${createQueryString({
          page: null,
          limit: null,
          search: searchValue
        })}`,
        {
          scroll: false
        }
      );
    }
    if (searchValue?.length === 0 || searchValue === undefined) {
      router.push(
        `${pathname}?${createQueryString({
          page: null,
          limit: null,
          search: null
        })}`,
        {
          scroll: false
        }
      );
    }

    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <>
      <Input
        placeholder={`Search ${searchKey}...`}
        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
        onChange={(event) =>
          table.getColumn(searchKey)?.setFilterValue(event.target.value)
        }
        className="mb-4 w-full md:max-w-sm"
      />

      {/* Desktop View */}
      <div className="hidden md:block">
        <ScrollArea className="h-[calc(80vh-220px)] rounded-md border">
          <Table className="relative" style={{ minWidth: '1000px' }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {/* 展开按钮列头 */}
                  <TableHead className="w-[40px]" />
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => row.toggleExpanded()}
                    >
                      {/* 展开/折叠按钮 */}
                      <TableCell className="w-[40px] p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            row.toggleExpanded();
                          }}
                        >
                          {row.getIsExpanded() ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {/* 展开的详情行 */}
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="p-0">
                          <ExpandedRowContent row={row as Row<LogStat>} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map((row) => (
              <MobileLogCard key={row.id} row={row as Row<LogStat>} />
            ))
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            No results.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} rows
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground sm:hidden">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setPagination({ pageIndex: 0, pageSize });
              }}
              disabled={pageIndex <= 0}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setPagination({
                  pageIndex: Math.max(0, pageIndex - 1),
                  pageSize
                });
              }}
              disabled={pageIndex <= 0}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="hidden text-sm font-medium sm:block sm:px-2">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setPagination({ pageIndex: pageIndex + 1, pageSize });
              }}
              disabled={!pageCount || pageIndex >= pageCount - 1}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (pageCount) {
                  setPagination({ pageIndex: pageCount - 1, pageSize });
                }
              }}
              disabled={!pageCount || pageIndex >= pageCount - 1}
            >
              <DoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
