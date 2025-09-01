'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Channel } from '@/lib/types';
import request from '@/app/lib/clientFetch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface KeyDetail {
  index: number;
  key: string;
  status: number;
  disable_reason: string;
  disable_time: number;
  usage: number;
  balance: number;
}

interface KeyStats {
  total: number;
  enabled: number;
  manually_disabled: number;
  auto_disabled: number;
}

interface MultiKeyManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
}

const statusMap: { [key: number]: { text: string; color: string } } = {
  1: { text: '已启用', color: 'bg-green-500' },
  2: { text: '手动禁用', color: 'bg-yellow-500' },
  3: { text: '自动禁用', color: 'bg-red-500' }
};

const MultiKeyManagementModal: React.FC<MultiKeyManagementModalProps> = ({
  open,
  onOpenChange,
  channel
}) => {
  const [keyDetails, setKeyDetails] = useState<KeyDetail[]>([]);
  const [keyStats, setKeyStats] = useState<KeyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalKeys, setTotalKeys] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchKeyData = useCallback(async () => {
    if (!channel) return;

    setIsLoading(true);
    setError(null);

    try {
      // 优化：先快速加载统计信息
      const statsRes = await request.get(
        `/api/channel/${channel.id}/keys/stats`
      );

      if ((statsRes as any).success) {
        setKeyStats((statsRes as any).data);
        setIsLoading(false); // 统计信息加载完成，立即显示
      } else {
        throw new Error((statsRes as any).message || '获取统计信息失败');
      }

      // 然后异步加载详情数据
      const detailsRes = await request.get(
        `/api/channel/${channel.id}/keys/details`,
        {
          params: {
            page: pagination.pageIndex + 1,
            page_size: Math.min(pagination.pageSize, 20), // 限制每页最大数量
            status: statusFilter === 'all' ? undefined : statusFilter
          }
        }
      );

      if ((detailsRes as any).success) {
        setKeyDetails((detailsRes as any).data.keys || []);
        setTotalKeys((detailsRes as any).data.total_count || 0);
      } else {
        throw new Error((detailsRes as any).message || '获取密钥详情失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
      setIsLoading(false);
    }
  }, [channel, pagination, statusFilter]);

  useEffect(() => {
    if (open && channel) {
      fetchKeyData();
    }
  }, [open, channel, fetchKeyData]);

  const handleToggleKeyStatus = async (
    keyIndex: number,
    currentStatus: number
  ) => {
    if (!channel) return;
    const newStatus = currentStatus === 1 ? 2 : 1; // 切换启用和手动禁用
    try {
      const res = await request.post('/api/channel/keys/toggle', {
        channel_id: channel.id,
        key_index: keyIndex,
        enabled: newStatus === 1
      });
      if ((res as any).success) {
        alert('操作成功');
        fetchKeyData();
      } else {
        throw new Error((res as any).message);
      }
    } catch (err) {
      alert(`操作失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleBatchToggle = async (status: number) => {
    if (!channel) return;
    try {
      const res = await request.post('/api/channel/keys/batch-toggle', {
        channel_id: channel.id,
        key_indices: Array.from({ length: keyDetails.length }, (_, i) => i),
        enabled: status === 1
      });
      if ((res as any).success) {
        alert(`成功${status === 1 ? '启用' : '禁用'}所有密钥`);
        fetchKeyData();
      } else {
        throw new Error((res as any).message);
      }
    } catch (err) {
      alert(`操作失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleDeleteDisabledKeys = async () => {
    if (!channel) return;
    if (!confirm('确定要删除所有被禁用的密钥吗？此操作不可恢复。')) return;
    try {
      const res = await request.post(`/api/channel/keys/delete-disabled`, {
        id: channel.id
      });
      if ((res as any).success) {
        alert('成功删除所有禁用密钥');
        fetchKeyData();
      } else {
        throw new Error((res as any).message);
      }
    } catch (err) {
      alert(`操作失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleFixKeyStatus = async () => {
    if (!channel) return;
    if (
      !confirm('确定要修复密钥状态吗？这将为所有没有状态的密钥设置为启用状态。')
    )
      return;
    try {
      const res = await request.post(`/api/channel/keys/fix-status`, {
        id: channel.id
      });
      if ((res as any).success) {
        alert('密钥状态修复成功');
        fetchKeyData();
        // 刷新父页面以更新渠道列表显示
        window.location.reload();
      } else {
        throw new Error((res as any).message);
      }
    } catch (err) {
      alert(`修复失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  if (!channel) return null;

  const pageCount = Math.ceil(totalKeys / pagination.pageSize);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            多密钥管理:{' '}
            <span className="font-bold text-primary">{channel.name}</span>
          </DialogTitle>
        </DialogHeader>
        {isLoading && !keyStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 animate-pulse rounded-lg bg-gray-200"></div>
              <div className="h-20 animate-pulse rounded-lg bg-gray-200"></div>
              <div className="h-20 animate-pulse rounded-lg bg-gray-200"></div>
            </div>
            <div className="h-8 animate-pulse rounded bg-gray-200"></div>
            <div className="h-64 animate-pulse rounded bg-gray-200"></div>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {keyStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card
                status="已启用"
                count={keyStats.enabled}
                total={keyStats.total}
                color="bg-green-500"
                description="正常可用的密钥"
              />
              <Card
                status="手动禁用"
                count={keyStats.manually_disabled}
                total={keyStats.total}
                color="bg-yellow-500"
                description="手动停用的密钥"
              />
              <Card
                status="自动禁用"
                count={keyStats.auto_disabled}
                total={keyStats.total}
                color="bg-red-500"
                description="系统自动停用的密钥"
              />
            </div>

            {/* 配置信息显示 */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">调用模式:</span>
                  <span className="font-medium">
                    {channel.multi_key_info?.key_selection_mode === 0
                      ? '轮询模式'
                      : '随机模式'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">编辑模式:</span>
                  <span className="font-medium">
                    {channel.multi_key_info?.batch_import_mode === 0
                      ? '覆盖模式'
                      : '追加模式'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  在渠道编辑页面可修改这些配置
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button onClick={fetchKeyData} size="sm">
                  刷新
                </Button>
                <Button
                  onClick={() => handleBatchToggle(2)}
                  size="sm"
                  variant="destructive"
                >
                  禁用全部
                </Button>
                <Button onClick={() => handleBatchToggle(1)} size="sm">
                  启用全部
                </Button>
                <Button
                  onClick={handleDeleteDisabledKeys}
                  size="sm"
                  variant="outline"
                >
                  删除禁用密钥
                </Button>
                <Button
                  onClick={handleFixKeyStatus}
                  size="sm"
                  variant="secondary"
                >
                  修复状态
                </Button>
              </div>
              <div className="w-48">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPagination({ ...pagination, pageIndex: 0 }); // 重置到第一页
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="筛选状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="1">已启用</SelectItem>
                    <SelectItem value="2">手动禁用</SelectItem>
                    <SelectItem value="3">自动禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>索引</TableHead>
                    <TableHead>密钥 (部分)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>禁用原因</TableHead>
                    <TableHead>禁用时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keyDetails.length === 0 && !error ? (
                    // 表格加载状态
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 w-8 animate-pulse rounded bg-gray-200"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : keyDetails.length > 0 ? (
                    keyDetails.map((key) => (
                      <TableRow key={key.index}>
                        <TableCell>#{key.index}</TableCell>
                        <TableCell className="font-mono">
                          {key.key.substring(0, 6)}...
                          {key.key.substring(key.key.length - 4)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${
                                statusMap[key.status]?.color || 'bg-gray-400'
                              }`}
                            >
                              {statusMap[key.status]?.text || '未知'}
                            </Badge>
                            {key.status === 3 && key.disable_reason && (
                              <span
                                className="text-xs text-muted-foreground"
                                title={key.disable_reason}
                              >
                                ⚠️
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{key.disable_reason || '-'}</TableCell>
                        <TableCell>
                          {key.disable_time
                            ? new Date(key.disable_time * 1000).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={
                              key.status === 1 ? 'destructive' : 'default'
                            }
                            onClick={() =>
                              handleToggleKeyStatus(key.index, key.status)
                            }
                          >
                            {key.status === 1 ? '禁用' : '启用'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                共 {totalKeys} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
                  }
                  disabled={pagination.pageIndex === 0}
                >
                  上一页
                </Button>
                <span>
                  第 {pagination.pageIndex + 1} / {pageCount} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
                  }
                  disabled={pagination.pageIndex + 1 >= pageCount}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Card = ({
  status,
  count,
  total,
  color,
  description
}: {
  status: string;
  count: number;
  total: number;
  color: string;
  description?: string;
}) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">{status}</h3>
        <span className="text-lg font-bold">
          {count} / {total}
        </span>
      </div>
      {description && (
        <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      )}
      <Progress value={percentage} className="h-2" />
      <div className="mt-1 text-right text-xs text-muted-foreground">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
};

export default MultiKeyManagementModal;
