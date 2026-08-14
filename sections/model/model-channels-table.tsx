'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { CHANNEL_OPTIONS } from '@/constants';
import { ModelChannelItem } from './types';

const TYPE_OPTIONS = CHANNEL_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.text
}));

const typeTextMap: Record<number, string> = CHANNEL_OPTIONS.reduce(
  (acc, o) => {
    acc[o.value] = o.text;
    return acc;
  },
  {} as Record<number, string>
);

// 渠道状态：1=启用 2=手动禁用 3=自动禁用（与 common.ChannelStatus* 对齐）
function statusBadge(status: number, enabled: boolean) {
  if (status === 1 && enabled) return <Badge variant="secondary">启用</Badge>;
  if (status === 2) return <Badge variant="destructive">手动禁用</Badge>;
  if (status === 3) return <Badge variant="destructive">自动禁用</Badge>;
  return <Badge variant="outline">未知</Badge>;
}

function typeBadge(type: number) {
  return <Badge variant="outline">{typeTextMap[type] || `类型 ${type}`}</Badge>;
}

const columns: ColumnDef<ModelChannelItem>[] = [
  {
    accessorKey: 'channel_id',
    header: '渠道ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.channel_id}</span>
    )
  },
  {
    accessorKey: 'channel_name',
    header: '渠道名称',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.channel_name || '-'}</span>
    )
  },
  {
    accessorKey: 'channel_type',
    header: '类型',
    cell: ({ row }) => typeBadge(row.original.channel_type)
  },
  {
    accessorKey: 'group',
    header: '分组',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.group}</span>
    )
  },
  {
    accessorKey: 'channel_status',
    header: '状态',
    cell: ({ row }) =>
      statusBadge(row.original.channel_status, row.original.enabled)
  },
  {
    accessorKey: 'priority',
    header: '静态优先级',
    cell: ({ row }) => (
      <span className="font-mono">{row.original.priority}</span>
    )
  },
  {
    accessorKey: 'dynamic_priority',
    header: '动态优先级',
    cell: ({ row }) => (
      <span className="font-mono font-semibold text-primary">
        {row.original.dynamic_priority || '-'}
      </span>
    )
  },
  {
    accessorKey: 'weight',
    header: '权重',
    cell: ({ row }) => <span className="font-mono">{row.original.weight}</span>
  },
  {
    accessorKey: 'unit_price',
    header: '单价',
    cell: ({ row }) => (
      <span className="font-mono">
        {row.original.unit_price > 0 ? row.original.unit_price.toFixed(4) : '-'}
      </span>
    )
  }
];

export default function ModelChannelsTable({ model }: { model: string }) {
  const [data, setData] = useState<ModelChannelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ model });
      if (typeFilter) params.set('channel_type', typeFilter);
      const res = await fetch(`/api/channel/model_channels?${params}`);
      const body = await res.json();
      if (res.ok && body?.success) {
        setData(body.data || []);
      } else {
        setError(body?.message || `加载失败（HTTP ${res.status}）`);
        setData([]);
      }
    } catch (e: any) {
      setError(e?.message || '网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [model, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自动刷新：动态优先级 5 分钟更新一次，30 秒拉取足够实时
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={typeFilter || 'all'}
          onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}
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
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="h-4 w-4"
          />
          自动刷新（30s）
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          共 {data.length} 个渠道
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <DataTable
          columns={columns}
          data={data}
          totalItems={data.length}
          pageSizeOptions={[10, 50, 100]}
          minWidth="1100px"
        />
      </div>
    </div>
  );
}
