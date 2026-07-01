'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DateTimeRangePicker } from '@/components/datetime-range-picker';
import { ImageStat } from '@/lib/types/image';
import { columns } from './columns';
import { useTableFilters } from './use-table-filters';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Search,
  X,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import dayjs from 'dayjs';

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  succeeded: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  submitted: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  running: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  failed: 'border-red-500/30 bg-red-500/10 text-red-400'
};

// ─── Mobile card ─────────────────────────────────────────────────────────────

const MobileImageCard = ({ item }: { item: ImageStat }) => {
  const statusStyle =
    STATUS_STYLE[item.status ?? ''] ??
    'border-border bg-muted/30 text-muted-foreground';

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Status accent strip */}
      <div
        className={`flex items-center justify-between border-b border-white/[0.04] bg-white/[0.02] px-4 py-2.5`}
      >
        <span className="font-mono text-[11px] text-muted-foreground">
          {dayjs(Number(item.created_at || 0) * 1000).format(
            'YYYY-MM-DD HH:mm:ss'
          )}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyle}`}
        >
          {item.status}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <MobileField label="User" value={item.username} />
          <MobileField label="Provider" value={item.provider} />
        </div>
        <MobileField label="Model" value={item.model} mono />

        <div className="grid grid-cols-3 divide-x divide-border/50 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <MobileField label="Mode" value={item.mode} center padded />
          <MobileField
            label="Images"
            value={String(item.n ?? 0)}
            center
            padded
          />
          <MobileField
            label="Cost"
            value={`$${((item.quota || 0) / 500000).toFixed(6)}`}
            center
            padded
            valueClass="font-mono text-emerald-400"
          />
        </div>

        {item.store_url &&
          (() => {
            let urls: string[] = [];
            try {
              const parsed = JSON.parse(item.store_url);
              urls = Array.isArray(parsed)
                ? parsed.filter(
                    (u): u is string => typeof u === 'string' && !!u
                  )
                : [item.store_url];
            } catch {
              urls = [item.store_url];
            }
            return (
              <div className="flex flex-wrap gap-1.5">
                {urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 transition-colors hover:bg-sky-500/15"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {urls.length > 1 ? `Image ${i + 1}` : 'View Image'}
                  </a>
                ))}
              </div>
            );
          })()}

        {item.fail_reason && (
          <div className="bg-red-500/8 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400">
            <span className="font-semibold">Error: </span>
            {item.fail_reason}
          </div>
        )}
      </div>
    </div>
  );
};

const MobileField = ({
  label,
  value,
  mono,
  center,
  padded,
  valueClass
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  center?: boolean;
  padded?: boolean;
  valueClass?: string;
}) => (
  <div
    className={`flex flex-col gap-0.5 ${center ? 'items-center' : ''} ${
      padded ? 'px-3 py-2.5' : ''
    }`}
  >
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {label}
    </span>
    <span
      className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${
        valueClass ?? ''
      } ${!value ? 'text-muted-foreground/40' : ''}`}
      title={value ?? '—'}
    >
      {value || '—'}
    </span>
  </div>
);

// ─── Filter input ─────────────────────────────────────────────────────────────

const FilterInput = ({
  placeholder,
  value,
  onChange,
  onKeyDown
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) => (
  <div className="relative">
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className="h-9 border-white/[0.08] bg-background/60 pr-8 text-sm placeholder:text-muted-foreground/40 focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImageTable({
  data,
  totalData
}: {
  data: ImageStat[];
  totalData: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = [10, 100].includes(Number((session?.user as any)?.role));

  const filterColumns = columns.filter((item) => {
    if (!['username', 'channel_id', 'user_id'].includes(item.id as string))
      return true;
    return isAdmin;
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

  const [localTaskId, setLocalTaskId] = useState(taskId || '');
  const [localProvider, setLocalProvider] = useState(provider || '');
  const [localModelName, setLocalModelName] = useState(modelName || '');
  const [localChannelId, setLocalChannelId] = useState(channelId || '');
  const [localUserName, setLocalUserName] = useState(userName || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isSearching, startSearchTransition] = React.useTransition();

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
    startSearchTransition(() => {
      router.refresh();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ── CSV export ────────────────────────────────────────────────────────────

  const exportToCSV = React.useCallback(
    (rows: ImageStat[], filename: string) => {
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
        ...rows.map((row) =>
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

  const exportCurrentPage = React.useCallback(() => {
    exportToCSV(
      data,
      `image-logs-page-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-')}.csv`
    );
  }, [data, exportToCSV]);

  const exportAllData = React.useCallback(async () => {
    try {
      const allImageData: ImageStat[] = [];
      const pageSizePerRequest = 10000;
      const concurrentRequests = 10;
      const userApi = isAdmin ? `/api/image` : `/api/image/self`;

      const buildParams = (p: number) => {
        const params = new URLSearchParams();
        params.set('page', String(p));
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

      const fetchPage = async (p: number): Promise<ImageStat[]> => {
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${buildParams(p)}`,
          {
            credentials: 'include',
            headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
          }
        );
        const { data: d } = await res.json();
        return (d && d.list) || [];
      };

      const firstList = await fetchPage(0);
      const firstRes = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${buildParams(0)}`,
        {
          credentials: 'include',
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
        }
      );
      const { data: firstData } = await firstRes.json();
      const total = firstData?.total || 0;
      if (firstList.length > 0) allImageData.push(...firstList);

      const totalPages = Math.ceil(total / pageSizePerRequest);
      for (let i = 1; i < totalPages; i += concurrentRequests) {
        const results = await Promise.all(
          Array.from(
            { length: Math.min(concurrentRequests, totalPages - i) },
            (_, j) => fetchPage(i + j)
          )
        );
        results.forEach((d) => {
          if (d.length > 0) allImageData.push(...d);
        });
      }

      exportToCSV(
        allImageData,
        `image-logs-all-${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, '-')}.csv`
      );
      alert(`✅ 导出完成！共导出 ${allImageData.length} 条图像记录`);
    } catch (error) {
      console.error('导出失败:', error);
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
    isAdmin,
    exportToCSV
  ]);

  React.useEffect(() => {
    const id = setTimeout(
      () => router.refresh(),
      process.env.NODE_ENV === 'development' ? 50 : 0
    );
    return () => clearTimeout(id);
  }, [page, pageSize, router]);

  const handlePageSizeChange = React.useCallback(
    (newPageSize: number) => {
      React.startTransition(() => {
        setPageSize(newPageSize);
        setPage(1);
      });
    },
    [setPageSize, setPage]
  );

  const activeFilterCount = [
    localTaskId,
    localProvider,
    localModelName,
    localChannelId,
    localUserName
  ].filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ━━ Header bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-accent-ezl/15 shadow-inner ring-1 ring-white/10">
            <ImageIcon className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">
              Image Logs
            </h2>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-px font-mono text-[11px] text-muted-foreground">
                {totalData.toLocaleString()}
                <span className="ml-1 text-muted-foreground/50">records</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <DateTimeRangePicker
            value={dateTimeRange}
            onValueChange={(r) => {
              setDateTimeRange(r);
              setPage(1);
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-white/[0.08] bg-white/[0.03] text-sm hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                <Download className="h-3.5 w-3.5 opacity-70" />
                Export
                <ChevronDown className="h-3 w-3 opacity-40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={exportCurrentPage}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Current page</span>
                  <span className="text-xs text-muted-foreground">
                    {data.length} records
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAllData}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    All matching records
                  </span>
                  <span className="text-xs text-muted-foreground">
                    With current filters applied
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ━━ Filter panel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-card shadow-sm">
        {/* Gradient accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Toggle header */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/20 px-1.5 font-mono text-[10px] font-semibold text-primary ring-1 ring-primary/30">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="text-muted-foreground/40">
            {filtersOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* Filter body */}
        {filtersOpen && (
          <div className="border-t border-white/[0.05] px-4 pb-4 pt-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <FilterField label="Task ID">
                <FilterInput
                  placeholder="e.g. task-abc123"
                  value={localTaskId}
                  onChange={setLocalTaskId}
                  onKeyDown={handleKeyDown}
                />
              </FilterField>
              <FilterField label="Provider">
                <FilterInput
                  placeholder="e.g. openai"
                  value={localProvider}
                  onChange={setLocalProvider}
                  onKeyDown={handleKeyDown}
                />
              </FilterField>
              <FilterField label="Model">
                <FilterInput
                  placeholder="e.g. dall-e-3"
                  value={localModelName}
                  onChange={setLocalModelName}
                  onKeyDown={handleKeyDown}
                />
              </FilterField>
              {isAdmin && (
                <>
                  <FilterField label="Channel ID">
                    <FilterInput
                      placeholder="e.g. 15543"
                      value={localChannelId}
                      onChange={setLocalChannelId}
                      onKeyDown={handleKeyDown}
                    />
                  </FilterField>
                  <FilterField label="Username">
                    <FilterInput
                      placeholder="e.g. john"
                      value={localUserName}
                      onChange={setLocalUserName}
                      onKeyDown={handleKeyDown}
                    />
                  </FilterField>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.04] pt-4">
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                size="sm"
                className="gap-2 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 focus-visible:ring-blue-500/50"
              >
                {isSearching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                {isSearching ? 'Searching…' : 'Search'}
              </Button>
              {isAnyFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground/60 hover:text-foreground"
                  onClick={() => {
                    resetFilters();
                    setPage(1);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ━━ Search overlay ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isSearching && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative duration-150 animate-in zoom-in-90">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-white shadow-2xl shadow-blue-500/30">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium tracking-tight">
                Searching…
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ━━ Desktop table ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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

      {/* ━━ Mobile list ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3 md:hidden">
        {data.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] py-16 text-center">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground/40">No records found</p>
          </div>
        ) : (
          data.map((item, index) => (
            <MobileImageCard key={item.task_id || index} item={item} />
          ))
        )}

        {/* Mobile pagination */}
        <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
          <span className="font-mono text-xs text-muted-foreground/50">
            {totalData.toLocaleString()} total
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-white/[0.08] bg-white/[0.02] px-3 hover:bg-white/[0.05]"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="min-w-[2rem] text-center font-mono text-sm font-medium">
              {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-white/[0.08] bg-white/[0.02] px-3 hover:bg-white/[0.05]"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FilterField = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
      {label}
    </label>
    {children}
  </div>
);
