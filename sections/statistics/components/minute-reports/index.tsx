'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  defaultStatsDraft,
  localMinute,
  normalizeStatsDraft
} from '@/lib/request-statistics';
import type { StatsDraft } from '@/lib/request-statistics';
import type { StatsQuery } from '@/lib/types/request-statistics';
import { selectClass } from './shared';
import { SuccessReportCard } from './success-report';
import { ModelReportCard } from './model-report';

export default function RequestMinuteReports() {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user) return null;
  const admin = Number(session.user.role) >= 10;
  // 身份切换后丢弃筛选、在途请求及详情快照。
  return <MinuteReports key={`${session.user.id}:${admin}`} admin={admin} />;
}
function MinuteReports({ admin }: { admin: boolean }) {
  const [draft, setDraft] = useState(defaultStatsDraft);
  const [query, setQuery] = useState<StatsQuery>(() =>
    normalizeStatsDraft(defaultStatsDraft(), admin)
  );
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const update = <K extends keyof StatsDraft>(key: K, value: StatsDraft[K]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const apply = (next = draft) => {
    try {
      setQuery(normalizeStatsDraft(next, admin));
      setError(null);
      setVersion((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : '筛选参数不合法');
    }
  };
  const reset = () => {
    const next = defaultStatsDraft();
    setDraft(next);
    apply(next);
  };
  return (
    <section
      aria-labelledby="minute-reports-title"
      className="space-y-4 border-t pt-6"
      data-testid="minute-reports"
    >
      <Card>
        <CardHeader>
          <CardTitle id="minute-reports-title">请求分钟报表</CardTitle>
          <CardDescription>
            按已落库日志统计：消费日志计成功，错误日志计失败。每行计一次；未记录的请求不计入。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="minute-from">开始时间</Label>
                <Input
                  id="minute-from"
                  type="datetime-local"
                  step={60}
                  value={draft.from}
                  onChange={(e) => update('from', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minute-to">结束时间（不含）</Label>
                <Input
                  id="minute-to"
                  type="datetime-local"
                  step={60}
                  value={draft.to}
                  onChange={(e) => update('to', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minute-model">模型名称</Label>
                <Input
                  id="minute-model"
                  placeholder="全部模型；输入精确名称"
                  value={draft.model}
                  onChange={(e) => update('model', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minute-interval">时间粒度</Label>
                <select
                  id="minute-interval"
                  className={selectClass}
                  value={draft.interval}
                  onChange={(e) =>
                    update('interval', e.target.value as StatsDraft['interval'])
                  }
                >
                  <option value="auto">自动</option>
                  <option value="1m">1 分钟</option>
                  <option value="5m">5 分钟</option>
                  <option value="15m">15 分钟</option>
                  <option value="1h">1 小时</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minute-token">Token 名称</Label>
                <Input
                  id="minute-token"
                  value={draft.token}
                  onChange={(e) => update('token', e.target.value)}
                  placeholder="输入部分 Token 名称；留空为全部"
                />
              </div>
              {admin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="minute-user">用户名</Label>
                    <Input
                      id="minute-user"
                      value={draft.user}
                      onChange={(e) => update('user', e.target.value)}
                      placeholder="输入部分用户名；留空为全部"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minute-channel">渠道 ID</Label>
                    <Input
                      id="minute-channel"
                      inputMode="numeric"
                      value={draft.channel}
                      onChange={(e) => update('channel', e.target.value)}
                      placeholder="全部渠道；0 为未分配"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit">查询分钟报表</Button>
              <Button type="button" variant="outline" onClick={reset}>
                重置并查询今天
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const end = new Date(Math.floor(Date.now() / 60000) * 60000);
                  setDraft((d) => ({
                    ...d,
                    from: localMinute(new Date(end.getTime() - 3600000)),
                    to: localMinute(end)
                  }));
                }}
              >
                最近一小时
              </Button>
              <span className="text-xs text-muted-foreground">
                浏览器时区：{Intl.DateTimeFormat().resolvedOptions().timeZone} ·
                仅查询已结束分钟{!admin && ' · 当前用户'}
              </span>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              两个图表按所选起止时间完整展示；暂无数据的时间段保留为空。范围较大时自动调粗粒度。自动刷新使用已提交的固定时间范围。TPM
              仅包含已记录的输入与输出 Token。
            </p>
          </form>
        </CardContent>
      </Card>
      <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-2">
        <SuccessReportCard
          key={`success-${version}`}
          query={query}
          admin={admin}
        />
        <ModelReportCard key={`models-${version}`} query={query} />
      </div>
    </section>
  );
}
