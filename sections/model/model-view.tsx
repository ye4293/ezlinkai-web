'use client';

import { useCallback, useEffect, useState } from 'react';
import { CHANNEL_OPTIONS } from '@/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { RefreshCw, Search } from 'lucide-react';

// —— 类型定义（与后端 controller/dynamic_priority_view.go 对齐）——
interface ModelChannelItem {
  channel_id: number;
  channel_name: string;
  channel_type: number;
  group: string;
  enabled: boolean;
  channel_status: number;
  priority: number;
  dynamic_priority: number;
  weight: number;
  unit_price: number;
}

interface ModelChannelGroup {
  model: string;
  channels: ModelChannelItem[];
  total_channels: number;
  enabled_channels: number;
}

// 渠道类型 value → text 映射，用于表格展示
const typeTextMap: Record<number, string> = CHANNEL_OPTIONS.reduce(
  (acc, o) => {
    acc[o.value] = o.text;
    return acc;
  },
  {} as Record<number, string>
);

// 渠道状态码：1=启用 2=手动禁用 3=自动禁用（与 common.ChannelStatus* 对齐）
function statusBadge(status: number, enabled: boolean) {
  if (status === 1 && enabled) {
    return <Badge variant="secondary">启用</Badge>;
  }
  if (status === 2) {
    return <Badge variant="destructive">手动禁用</Badge>;
  }
  if (status === 3) {
    return <Badge variant="destructive">自动禁用</Badge>;
  }
  return <Badge variant="outline">未知</Badge>;
}

function typeBadge(type: number) {
  const text = typeTextMap[type] || `类型 ${type}`;
  return <Badge variant="outline">{text}</Badge>;
}

export default function ModelView() {
  const [groups, setGroups] = useState<ModelChannelGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件
  const [modelPrefix, setModelPrefix] = useState('');
  const [channelType, setChannelType] = useState<string>('all');

  // 自动刷新（动态优先级实时性）
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 用原生 fetch 而非 clientFetch：clientFetch 响应拦截器会改变返回结构
      // （200 时直接返回后端响应体，错误时不 reject），解析逻辑容易踩坑。
      // Next API route（app/api/channel/model_channels/route.ts）服务端用 auth()
      // 注入 token，客户端无需传 Authorization。
      const params = new URLSearchParams();
      if (modelPrefix.trim()) params.set('model_prefix', modelPrefix.trim());
      if (channelType && channelType !== 'all')
        params.set('channel_type', channelType);
      const url = `/api/channel/model_channels${
        params.toString() ? '?' + params.toString() : ''
      }`;
      const res = await fetch(url);
      const body = await res.json();
      if (res.ok && body && body.success) {
        setGroups(body.data || []);
      } else {
        setError(body?.message || `加载失败（HTTP ${res.status}）`);
        setGroups([]);
      }
    } catch (e: any) {
      setError(e?.message || '网络错误');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [modelPrefix, channelType]);

  // 首次加载 + 筛选变化时重新拉取
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自动刷新：每 30 秒拉一次（动态优先级每 5 分钟更新一次，30 秒足够实时）
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  return (
    <div className="space-y-4">
      {/* 筛选区 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="模型名前缀（如 gpt-4）"
            value={modelPrefix}
            onChange={(e) => setModelPrefix(e.target.value)}
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchData();
            }}
          />
        </div>
        <Select value={channelType} onValueChange={setChannelType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部渠道类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部渠道类型</SelectItem>
            {CHANNEL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.text}
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
          共 {groups.length} 个模型
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 模型分组列表 */}
      {groups.length === 0 && !loading ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          暂无数据
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {groups.map((g) => (
            <AccordionItem key={g.model} value={g.model}>
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">
                    {g.model}
                  </span>
                  <Badge variant="secondary">{g.total_channels} 渠道</Badge>
                  <Badge variant="outline">{g.enabled_channels} 启用</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ChannelTable channels={g.channels} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

function ChannelTable({ channels }: { channels: ModelChannelItem[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">渠道ID</TableHead>
            <TableHead>渠道名称</TableHead>
            <TableHead className="w-36">类型</TableHead>
            <TableHead className="w-24">分组</TableHead>
            <TableHead className="w-24">状态</TableHead>
            <TableHead className="w-28 text-right">静态优先级</TableHead>
            <TableHead className="w-28 text-right">动态优先级</TableHead>
            <TableHead className="w-20 text-right">权重</TableHead>
            <TableHead className="w-24 text-right">单价</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.map((ch) => (
            <TableRow key={`${ch.channel_id}-${ch.group}`}>
              <TableCell className="font-mono text-xs">
                {ch.channel_id}
              </TableCell>
              <TableCell className="font-medium">
                {ch.channel_name || '-'}
              </TableCell>
              <TableCell>{typeBadge(ch.channel_type)}</TableCell>
              <TableCell className="font-mono text-xs">{ch.group}</TableCell>
              <TableCell>
                {statusBadge(ch.channel_status, ch.enabled)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {ch.priority}
              </TableCell>
              <TableCell className="text-right font-mono font-semibold text-primary">
                {ch.dynamic_priority || '-'}
              </TableCell>
              <TableCell className="text-right font-mono">
                {ch.weight}
              </TableCell>
              <TableCell className="text-right font-mono">
                {ch.unit_price > 0 ? ch.unit_price.toFixed(4) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
