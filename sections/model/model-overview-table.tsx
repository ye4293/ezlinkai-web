'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useState, useEffect, useCallback } from 'react';
import { useQueryState } from 'nuqs';
import { searchParams } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
import { CHANNEL_OPTIONS } from '@/constants';
import { ModelOverviewItem, ModelOverviewResponse } from './types';

// 渠道类型选项（筛选用）
const TYPE_OPTIONS = CHANNEL_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.text
}));

// 列定义
const columns: ColumnDef<ModelOverviewItem>[] = [
  {
    accessorKey: 'model',
    header: '模型',
    cell: ({ row }) => {
      const m = row.original.model;
      return (
        <a
          href={`/dashboard/model/${encodeURIComponent(m)}`}
          className="font-mono text-sm font-medium text-primary hover:underline"
        >
          {m}
        </a>
      );
    }
  },
  {
    accessorKey: 'total_channels',
    header: '挂载渠道数',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.total_channels}</Badge>
    )
  },
  {
    accessorKey: 'enabled_channels',
    header: '启用渠道数',
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.enabled_channels}</Badge>
    )
  },
  {
    accessorKey: 'top_dynamic_priority',
    header: '最高动态优先级',
    cell: ({ row }) => {
      const v = row.original.top_dynamic_priority;
      return (
        <span className="font-mono font-semibold text-primary">{v || '-'}</span>
      );
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => (
      <a href={`/dashboard/model/${encodeURIComponent(row.original.model)}`}>
        <Button variant="outline" size="sm">
          查看渠道
        </Button>
      </a>
    )
  }
];

export default function ModelOverviewTable() {
  // nuqs 管理 URL 状态：q（模型前缀）、type（渠道类型）、page、limit
  // shallow:false 让 URL 变化触发 RSC 重渲染——但本组件是客户端 fetch，
  // 这里只用 nuqs 同步 URL，fetch 由本组件 useEffect 驱动。
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q.withOptions({ shallow: true }).withDefault('')
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    'type',
    searchParams.type.withOptions({ shallow: true }).withDefault('')
  );
  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withOptions({ shallow: true }).withDefault(1)
  );
  const [pageSize, setPageSize] = useQueryState(
    'limit',
    searchParams.limit.withOptions({ shallow: true }).withDefault(10)
  );

  const [data, setData] = useState<ModelOverviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (searchQuery) params.set('model_prefix', searchQuery);
      if (typeFilter) params.set('channel_type', typeFilter);

      const res = await fetch(`/api/channel/models_overview?${params}`);
      const body: ModelOverviewResponse & {
        success: boolean;
        message?: string;
      } = await res.json();
      if (res.ok && body.success) {
        setData(body.list || []);
        setTotal(body.total || 0);
      } else {
        setError(body?.message || `加载失败（HTTP ${res.status}）`);
        setData([]);
        setTotal(0);
      }
    } catch (e: any) {
      setError(e?.message || '网络错误');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isFilterActive = !!searchQuery || !!typeFilter;

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setPage(1);
  };

  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* 筛选区 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="模型名前缀（如 gpt-4）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1);
            }}
          />
        </div>
        <Select
          value={typeFilter || 'all'}
          onValueChange={(v) => {
            setTypeFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部渠道类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部渠道类型</SelectItem>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          刷新
        </Button>
        <DataTableResetFilter
          isFilterActive={isFilterActive}
          onReset={resetFilters}
        />
        <div className="ml-auto text-sm text-muted-foreground">
          共 {total} 个模型
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-md border">
        <DataTable
          columns={columns}
          data={data}
          totalItems={total}
          currentPage={page}
          pageSize={pageSize}
          setCurrentPage={(p) => setPage(p)}
          setPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          pageSizeOptions={[10, 50, 100]}
          minWidth="900px"
        />
      </div>
    </div>
  );
}
