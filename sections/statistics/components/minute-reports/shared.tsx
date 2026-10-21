'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  StatsFreshness,
  SuccessReport
} from '@/lib/types/request-statistics';
import { formatStatsTime } from '@/lib/request-statistics';
import { RefreshCw } from 'lucide-react';

export const selectClass =
  'h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function ReportControls({
  loading,
  refresh,
  cancel,
  automatic,
  setAutomatic
}: {
  loading: boolean;
  refresh: () => void;
  cancel: () => void;
  automatic: boolean;
  setAutomatic: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={automatic}
          onChange={(e) => setAutomatic(e.target.checked)}
        />
        每 30 秒刷新本图
      </label>
      <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
        <RefreshCw
          className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`}
        />
        刷新
      </Button>
      {loading && (
        <Button size="sm" variant="ghost" onClick={cancel}>
          取消
        </Button>
      )}
    </div>
  );
}
export function ReportStatus({
  loading,
  error,
  hasData,
  refresh
}: {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  refresh: () => void;
}) {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <span>
            {error}
            {hasData && ' 当前保留上次结果。'}
          </span>
          <Button variant="outline" size="sm" onClick={refresh}>
            重试
          </Button>
        </div>
      )}
      {loading && !hasData && (
        <div role="status" aria-label="正在查询报表">
          <Skeleton className="mb-3 h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </>
  );
}
export function Freshness({ value }: { value: StatsFreshness }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant={value.incomplete ? 'secondary' : 'outline'}>
        {value.incomplete ? '尚未完整统计' : '已完成扫描'}
      </Badge>
      {!value.source_healthy ? (
        <span>源日志范围未确认，速率暂不可用。</span>
      ) : value.incomplete ? (
        <span>
          完整展示查询范围；未覆盖的时间段暂无数据，缺失分钟不计为零。
        </span>
      ) : (
        <span>迟到日志补算后可能更新。</span>
      )}
      {value.aggregated_before !== undefined && (
        <span>已扫描至 {formatStatsTime(value.aggregated_before)}（不含）</span>
      )}
    </div>
  );
}
export function ReportRange({
  data
}: {
  data: Pick<
    SuccessReport,
    'start_timestamp' | 'end_timestamp' | 'interval_seconds'
  >;
}) {
  return (
    <p className="text-xs text-muted-foreground" data-testid="minute-range">
      查询范围：{formatStatsTime(data.start_timestamp)} –{' '}
      {formatStatsTime(data.end_timestamp)}（不含）
      {' · '}实际粒度：
      {data.interval_seconds < 3600
        ? `${data.interval_seconds / 60} 分钟`
        : `${data.interval_seconds / 3600} 小时`}
    </p>
  );
}
export function MetricGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-lg bg-muted/40 p-3">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words text-lg font-semibold tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
