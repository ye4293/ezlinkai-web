'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TopUpRecord {
  id: number;
  user_id: number;
  amount: number;
  money: number;
  trade_no: string;
  payment_method: string;
  /** 后端写入：易支付 CNY；Stripe 以 Checkout 回调 currency 为准（支持 USD/CNY 等） */
  currency?: string;
  /** 扩展 JSON：补单时为 manual_complete 结构，支付回调通常为空 */
  other?: string;
  create_time: number;
  complete_time: number;
  status: string;
}

const PAGE_SIZE = 10;

const statusConfig: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  success: { label: '成功', variant: 'default' },
  pending: { label: '待支付', variant: 'secondary' },
  failed: { label: '失败', variant: 'destructive' },
  expired: { label: '已过期', variant: 'outline' }
};

/** 币种以接口返回的 currency 为准；Stripe 未支付完成前可能为空 */
function currencyBadge(record: TopUpRecord): string {
  const c = (record.currency || '').trim().toUpperCase();
  if (c) return c;
  if ((record.payment_method || '').toLowerCase() === 'stripe') {
    return '—';
  }
  return 'CNY';
}

function formatPayMoney(record: TopUpRecord): string {
  const c = (record.currency || '').trim().toUpperCase();
  const m = record.money;
  if (c === 'USD') return `$${m.toFixed(2)}`;
  if (c === 'CNY' || c === 'CNH') return `¥${m.toFixed(2)}`;
  if (c) return `${m.toFixed(2)} ${c}`;
  if ((record.payment_method || '').toLowerCase() === 'stripe') {
    return m.toFixed(2);
  }
  return `¥${m.toFixed(2)}`;
}

function paymentMethodLabel(method: string): string {
  const m = (method || '').toLowerCase();
  const map: Record<string, string> = {
    stripe: 'Stripe',
    alipay: '支付宝',
    wxpay: '微信',
    qqpay: 'QQ 钱包'
  };
  return map[m] || method || '-';
}

/** 解析 other 中补单 JSON，用于「入账方式」展示 */
function manualCompleteSummary(other?: string): string | null {
  const raw = (other || '').trim();
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as {
      source?: string;
      operator_user_id?: number;
      operator_username?: string;
      operator_display_name?: string;
    };
    if (o.source === 'manual_complete') {
      if (o.operator_display_name && o.operator_username) {
        return `管理员：${o.operator_display_name} (${o.operator_username})`;
      }
      if (o.operator_username) {
        return `管理员：${o.operator_username}`;
      }
      if (o.operator_display_name) {
        return `管理员：${o.operator_display_name}`;
      }
      if (o.operator_user_id) {
        return `管理员：用户 #${o.operator_user_id}`;
      }
      return '管理员补单';
    }
    return `扩展：${raw.length > 80 ? `${raw.slice(0, 80)}…` : raw}`;
  } catch {
    return raw.length > 80 ? `${raw.slice(0, 80)}…` : raw;
  }
}

export default function TransactionHistory() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role !== undefined && session.user.role >= 10;

  const [records, setRecords] = useState<TopUpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [tradeNoQuery, setTradeNoQuery] = useState('');
  const [completingId, setCompletingId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        pagesize: String(PAGE_SIZE)
      });
      if (tradeNoQuery) {
        params.set('trade_no', tradeNoQuery);
      }
      const res = await fetch(`/api/user/topup/self?${params.toString()}`);
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || '获取充值记录失败');
      }
      setRecords(result?.data?.list || []);
      setTotal(result?.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
      setError('获取充值记录失败');
    } finally {
      setLoading(false);
    }
  }, [page, tradeNoQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSearch = () => {
    setPage(1);
    setTradeNoQuery(searchInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setPage(1);
    setTradeNoQuery('');
  };

  const handleComplete = async (record: TopUpRecord) => {
    if (completingId !== null) return;
    setCompletingId(record.id);
    try {
      const res = await fetch('/api/user/topup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade_no: record.trade_no })
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || '补单失败');
      }
      toast.success('补单成功');
      router.refresh();
      fetchRecords();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '补单失败');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <Card className="mt-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">充值记录</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索订单号..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 w-[200px] pl-8 text-sm"
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleSearch}>
              搜索
            </Button>
            {tradeNoQuery && (
              <Button size="sm" variant="ghost" onClick={handleClearSearch}>
                清除
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : error ? (
          <div className="py-4 text-center text-sm text-destructive">
            {error}
          </div>
        ) : records.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>订单号</TableHead>
                    <TableHead>充值额度</TableHead>
                    <TableHead>币种</TableHead>
                    <TableHead>支付金额</TableHead>
                    <TableHead>支付方式</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>完成时间</TableHead>
                    <TableHead>入账方式</TableHead>
                    {isAdmin && <TableHead>操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const cfg = statusConfig[record.status] || {
                      label: record.status,
                      variant: 'outline' as const
                    };
                    const entrySummary = manualCompleteSummary(record.other);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(
                            new Date(record.create_time * 1000),
                            'yyyy-MM-dd HH:mm'
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {record.trade_no}
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.amount}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {currencyBadge(record)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatPayMoney(record)}
                        </TableCell>
                        <TableCell>
                          {paymentMethodLabel(record.payment_method)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {record.complete_time
                            ? format(
                                new Date(record.complete_time * 1000),
                                'yyyy-MM-dd HH:mm'
                              )
                            : '-'}
                        </TableCell>
                        <TableCell
                          className="max-w-[260px] text-sm text-muted-foreground"
                          title={
                            record.other?.trim() ? record.other : undefined
                          }
                        >
                          {entrySummary
                            ? entrySummary
                            : record.status === 'success'
                            ? '支付回调'
                            : '-'}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {record.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs"
                                disabled={completingId === record.id}
                                onClick={() => handleComplete(record)}
                              >
                                {completingId === record.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                补单
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            {tradeNoQuery ? '未找到匹配的订单' : '暂无充值记录'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
