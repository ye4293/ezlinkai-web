'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
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
import { RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { CHANNEL_OPTIONS } from '@/constants';
import { ModelChannelItem, ModelChannelsResponse } from './types';

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

// 可编辑优先级单元格：点击进入编辑，回车/确认提交，ESC 取消。
// 提交时调 PUT /api/channel/model_channel_priority，同步更新该渠道该模型所有 group 行。
function PriorityCell({
  channelId,
  model,
  value,
  onUpdated
}: {
  channelId: number;
  model: string;
  value: number;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(String(value));
  };

  const save = async () => {
    const n = parseInt(draft);
    if (isNaN(n) || n < 0) {
      toast.error('优先级必须是非负整数');
      return;
    }
    if (n === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/channel/model_channel_priority', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, model, priority: n })
      });
      const body = await res.json();
      if (res.ok && body.success) {
        toast.success(`已同步更新 ${body.affected} 个分组行`);
        setEditing(false);
        onUpdated();
      } else {
        toast.error(body?.message || '更新失败');
      }
    } catch (e: any) {
      toast.error(e?.message || '网络错误');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          className="h-8 w-20"
          autoFocus
          disabled={saving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={save}
          disabled={saving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={cancel}
          disabled={saving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <span
      className="cursor-pointer rounded px-1 font-mono hover:bg-accent"
      onClick={startEdit}
      title="点击编辑（同步所有分组）"
    >
      {value}
    </span>
  );
}

export default function ModelChannelsTable({ model }: { model: string }) {
  const [data, setData] = useState<ModelChannelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('0');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ model });
      if (typeFilter) params.set('channel_type', typeFilter);
      if (statusFilter !== '0') params.set('status_filter', statusFilter);
      params.set('page', String(currentPage));
      params.set('page_size', String(pageSize));
      const res = await fetch(`/api/channel/model_channels?${params}`);
      const body = await res.json();
      if (res.ok && body?.success) {
        const resData = body.data as ModelChannelsResponse['data'];
        setData(resData.list || []);
        setTotal(resData.total || 0);
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
  }, [model, typeFilter, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 筛选器变化时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter]);

  // 自动刷新：动态优先级 5 分钟更新一次，30 秒拉取足够实时
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  // 列定义用到 model 和 fetchData，故放在组件内
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
      accessorKey: 'groups',
      header: '分组',
      cell: ({ row }) => {
        const g = row.original.groups || [];
        if (g.length === 0)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {g.map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="font-mono text-xs"
              >
                {name}
              </Badge>
            ))}
          </div>
        );
      }
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
        <PriorityCell
          channelId={row.original.channel_id}
          model={model}
          value={row.original.priority}
          onUpdated={fetchData}
        />
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
      cell: ({ row }) => (
        <span className="font-mono">{row.original.weight}</span>
      )
    },
    {
      accessorKey: 'unit_price',
      header: '单价',
      cell: ({ row }) => (
        <span className="font-mono">
          {row.original.unit_price > 0
            ? row.original.unit_price.toFixed(4)
            : '-'}
        </span>
      )
    }
  ];

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">全部状态</SelectItem>
            <SelectItem value="1">启用</SelectItem>
            <SelectItem value="2">手动禁用</SelectItem>
            <SelectItem value="3">自动禁用</SelectItem>
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
          共 {total} 个渠道
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        同一渠道挂载同一模型时，所有分组的优先级/状态同步——编辑优先级会一次性更新该渠道该模型的全部分组行。
      </p>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <DataTable
          columns={columns}
          data={data}
          totalItems={total}
          currentPage={currentPage}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth="1100px"
        />
      </div>
    </div>
  );
}
