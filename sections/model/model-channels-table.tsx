'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
// 模型级自动禁用：渠道 status=1（启用）但该模型 auto_disabled=true —— 单独展示，
// 与整渠道禁用区分（该渠道其他模型仍可用）。
function statusBadge(status: number, enabled: boolean, autoDisabled: boolean) {
  if (status === 1 && enabled) return <Badge variant="secondary">启用</Badge>;
  if (status === 1 && autoDisabled)
    return (
      <Badge className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
        模型自动禁用
      </Badge>
    );
  if (status === 2) return <Badge variant="destructive">手动禁用</Badge>;
  if (status === 3) return <Badge variant="destructive">渠道自动禁用</Badge>;
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
  // 默认「启用」：详情页多数场景关心的是当前在服务的渠道，先展示 enabled 也让 SQL 扫描/排序的
  // 分组数从"全部渠道"降到"活的渠道"，页面感官更快。运维排查禁用原因再切到手动/自动禁用。
  const [statusFilter, setStatusFilter] = useState('1');
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

  // 选中的模型自动禁用行（仅 auto_disabled=true 的行可选）
  const [selectedRows, setSelectedRows] = useState<ModelChannelItem[]>([]);
  const [batchEnabling, setBatchEnabling] = useState(false);
  const selectableCount = useMemo(
    () => data.filter((d) => d.auto_disabled).length,
    [data]
  );
  const eligibleSelected = useMemo(
    () => selectedRows.filter((r) => r.auto_disabled),
    [selectedRows]
  );

  const batchEnable = async () => {
    if (eligibleSelected.length === 0) return;
    setBatchEnabling(true);
    try {
      const res = await fetch('/api/channel/model_channel_enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: eligibleSelected.map((r) => ({
            channel_id: r.channel_id,
            model
          }))
        })
      });
      const body = await res.json();
      if (res.ok && body.success) {
        const failed = (body.failed || []) as {
          channel_id: number;
          error: string;
        }[];
        if (failed.length > 0) {
          toast.warning(
            `批量启用：成功 ${body.affected}，失败 ${failed.length}`
          );
        } else {
          toast.success(`已启用 ${body.affected} 个模型`);
        }
        setSelectedRows([]);
        fetchData();
      } else {
        toast.error(body?.message || '批量启用失败');
      }
    } catch (e: any) {
      toast.error(e?.message || '网络错误');
    } finally {
      setBatchEnabling(false);
    }
  };

  // 列定义用到 model 和 fetchData，故放在组件内
  const columns: ColumnDef<ModelChannelItem>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        // 只允许勾选 auto_disabled=true 的行；全选也只作用于当前页 auto_disabled 行
        const eligible = table
          .getRowModel()
          .rows.filter((r) => r.original.auto_disabled);
        const allSelected =
          eligible.length > 0 && eligible.every((r) => r.getIsSelected());
        const someSelected = eligible.some((r) => r.getIsSelected());
        return (
          <Checkbox
            checked={
              allSelected ? true : someSelected ? 'indeterminate' : false
            }
            onCheckedChange={(value) => {
              eligible.forEach((r) => r.toggleSelected(!!value));
            }}
            disabled={eligible.length === 0}
            aria-label="全选被禁模型"
          />
        );
      },
      cell: ({ row }) =>
        row.original.auto_disabled ? (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="选择该行"
          />
        ) : null,
      enableSorting: false
    },
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
        statusBadge(
          row.original.channel_status,
          row.original.enabled,
          row.original.auto_disabled
        )
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
            <SelectItem value="3">渠道自动禁用</SelectItem>
            <SelectItem value="4">模型自动禁用</SelectItem>
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
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          {eligibleSelected.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={batchEnable}
              disabled={batchEnabling}
            >
              批量启用 ({eligibleSelected.length})
            </Button>
          )}
          <span>共 {total} 个渠道</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        同一渠道挂载同一模型时，所有分组的优先级/状态同步——编辑优先级会一次性更新该渠道该模型的全部分组行。
        {selectableCount > 0 && (
          <span className="ml-1 text-amber-700 dark:text-amber-300">
            当前页有 {selectableCount} 个模型级自动禁用行，可勾选后批量启用。
          </span>
        )}
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
          onSelectionChange={setSelectedRows}
          currentPage={currentPage}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth="1150px"
        />
      </div>
    </div>
  );
}
