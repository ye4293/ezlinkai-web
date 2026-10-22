'use client';

import { memo, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BarChart3, RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/providers/locale-provider';
import { useMinuteReport } from '@/sections/statistics/hooks/use-minute-report';
import type { ModelUsageHour, ModelUsageReport } from '@/lib/types/dashboard';
import { cn } from '@/lib/utils';

const colors = [
  '#3b82f6',
  '#14b8a6',
  '#8b5cf6',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#84cc16',
  '#d946ef',
  '#f97316',
  '#6366f1'
];

// 保留后端的六位十进制精度；仅柱子的高度转为 number。
function formatUSD(value: string | null | undefined) {
  if (value == null) return '—';
  const [integer, fraction = ''] = value.split('.');
  return `$${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(
    6,
    '0'
  )}`;
}

export const ModelUsageChart = memo(function ModelUsageChart({
  enabled
}: {
  enabled: boolean;
}) {
  const { lang, t } = useLocale();
  const copy = t.dashboard.modelUsage;
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const [metric, setMetric] = useState<'requests' | 'amount'>('requests');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const report = useMinuteReport<ModelUsageReport>(
    '/api/dashboard/models/usage',
    enabled ? {} : null
  );
  const data = report.data;
  const series = useMemo(
    () =>
      data?.series.map((model, i) => ({
        ...model,
        color: colors[i] ?? `hsl(${(i * 137.508) % 360} 65% 48%)`
      })) ?? [],
    [data]
  );
  const highlightedModel = series.some((model) => model.id === selectedModel)
    ? selectedModel
    : null;
  const orderedSeries = useMemo(() => {
    if (metric === 'requests') return series;
    // 先绑定模型颜色再排序；六位小数转整数比较，避免浮点精度改变顺序。
    return series
      .map((model) => ({
        model,
        amount:
          model.summary.used_quota_usd === null
            ? null
            : BigInt(model.summary.used_quota_usd.replace('.', ''))
      }))
      .sort((a, b) => {
        if (a.amount === b.amount) return 0;
        if (a.amount === null) return 1;
        if (b.amount === null) return -1;
        return a.amount > b.amount ? -1 : 1;
      })
      .map(({ model }) => model);
  }, [series, metric]);
  const points = useMemo(
    () =>
      data?.timeseries.map((hour) => ({
        ...hour,
        ...Object.fromEntries(
          series.map((model) => {
            const value = hour.values[model.id];
            return [
              model.id,
              metric === 'requests'
                ? value?.total_requests ?? null
                : value?.used_quota_usd == null
                ? null
                : Number(value.used_quota_usd)
            ];
          })
        )
      })) ?? [],
    [data, metric, series]
  );
  const number = (value: number | null | undefined) =>
    value == null ? '—' : value.toLocaleString(locale);
  const time = (seconds: number) =>
    format(new Date(seconds * 1000), 'yyyy-MM-dd HH:mm');

  return (
    <Card className="min-w-0" data-testid="dashboard-model-usage">
      <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
          {data && (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p title={copy.rangeEnd}>
                {time(data.start_timestamp)} – {time(data.end_timestamp)}
              </p>
              <p data-testid="model-usage-aggregated-until">
                {copy.aggregatedUntil} {time(data.aggregated_until)}
              </p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="flex rounded-lg bg-muted p-1"
            role="group"
            aria-label={copy.metric}
          >
            {(['requests', 'amount'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={metric === value}
                onClick={() => setMetric(value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  metric === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {copy[value]}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={report.refresh}
            disabled={report.loading || !enabled}
            aria-label={copy.refresh}
            title={copy.refresh}
          >
            <RefreshCw
              className={cn('h-4 w-4', report.loading && 'animate-spin')}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {report.error}
          </p>
        )}
        {report.loading && !data && (
          <Skeleton className="h-[360px] w-full" aria-label={copy.loading} />
        )}
        {data && (
          <>
            <div
              className="flex flex-wrap gap-x-8 gap-y-3 border-b pb-4"
              aria-live="polite"
            >
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  {copy.requests}
                </p>
                <p
                  className="text-2xl font-semibold tabular-nums"
                  data-testid="model-usage-total-requests"
                >
                  {number(data.summary.total_requests)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  {copy.amount}
                </p>
                <p
                  className="text-2xl font-semibold tabular-nums"
                  data-testid="model-usage-total-amount"
                >
                  {formatUSD(data.summary.used_quota_usd)}
                </p>
              </div>
            </div>
            {(data.freshness.incomplete ||
              (data.summary.used_quota_usd === null &&
                data.summary.total_requests !== null)) && (
              <div
                role="status"
                className="space-y-1 rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
              >
                {data.freshness.incomplete && <p>{copy.incomplete}</p>}
                {data.summary.used_quota_usd === null &&
                  data.summary.total_requests !== null && (
                    <p>{copy.amountPending}</p>
                  )}
              </div>
            )}
            <ChartContainer
              config={{}}
              className="aspect-auto h-[320px] w-full"
              aria-label={`${copy.title} · ${copy[metric]}`}
            >
              <BarChart
                accessibilityLayer
                data={points}
                stackOffset="sign"
                barCategoryGap="4%"
                margin={{ left: 0, right: 8, top: 12, bottom: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="bucket_start"
                  tickFormatter={(value) => time(Number(value))}
                  minTickGap={10}
                  tickMargin={10}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  width={60}
                  allowDecimals={metric === 'amount'}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(value: number) =>
                    metric === 'amount'
                      ? `$${value.toLocaleString(locale, {
                          maximumFractionDigits: 6,
                          notation:
                            Math.abs(value) >= 1000 ? 'compact' : 'standard'
                        })}`
                      : value.toLocaleString(locale, {
                          notation: 'compact',
                          maximumFractionDigits: 1
                        })
                  }
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Tooltip
                  filterNull={false}
                  isAnimationActive={false}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  wrapperStyle={{
                    zIndex: 30,
                    maxWidth: 'calc(100vw - 3rem)',
                    pointerEvents: 'auto'
                  }}
                  content={({ active, payload }) => {
                    const hour = payload?.[0]?.payload as
                      | ModelUsageHour
                      | undefined;
                    if (!active || !hour) return null;
                    return (
                      <div
                        className="max-w-[32rem] rounded-lg border bg-background p-3 text-xs shadow-lg"
                        data-testid="model-usage-tooltip"
                        onMouseMove={(event) => event.stopPropagation()}
                        onTouchStart={(event) => event.stopPropagation()}
                        onTouchMove={(event) => event.stopPropagation()}
                      >
                        <p className="mb-2 font-medium">
                          {time(hour.bucket_start)} – {time(hour.effective_end)}
                        </p>
                        {hour.is_partial && (
                          <p className="mb-2 text-muted-foreground">
                            {copy.currentHour}
                          </p>
                        )}
                        {hour.incomplete && (
                          <p className="mb-2 text-amber-600 dark:text-amber-400">
                            {copy.partialHour}
                          </p>
                        )}
                        {hour.amount_incomplete && (
                          <p className="mb-2 text-amber-600 dark:text-amber-400">
                            {copy.pendingAmount}
                          </p>
                        )}
                        <div
                          className="max-h-[min(16rem,50vh)] overflow-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          data-testid="model-usage-tooltip-scroll"
                          role="region"
                          aria-label={copy.details}
                          tabIndex={0}
                          onWheel={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key !== 'Escape') event.stopPropagation();
                          }}
                        >
                          <table className="w-full border-collapse text-left">
                            <thead className="sticky top-0 bg-background text-muted-foreground">
                              <tr>
                                <th className="pb-2 pr-4 font-normal">
                                  {copy.models}
                                </th>
                                <th className="whitespace-nowrap pb-2 pr-4 text-right font-normal">
                                  {copy.requests}
                                </th>
                                <th className="whitespace-nowrap pb-2 text-right font-normal">
                                  USD
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderedSeries
                                .filter(
                                  (model) =>
                                    (hour.values[model.id]?.total_requests ??
                                      0) > 0
                                )
                                .map((model) => (
                                  <tr
                                    key={model.id}
                                    className={cn(
                                      highlightedModel === model.id &&
                                        'bg-muted font-semibold'
                                    )}
                                  >
                                    <td className="max-w-52 break-all py-1 pr-4">
                                      <span
                                        className="mr-1.5 inline-block h-2 w-2 rounded-sm"
                                        style={{ background: model.color }}
                                      />
                                      {model.model_name}
                                    </td>
                                    <td className="whitespace-nowrap py-1 pr-4 text-right tabular-nums">
                                      {number(
                                        hour.values[model.id]?.total_requests
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap py-1 text-right tabular-nums">
                                      {formatUSD(
                                        hour.values[model.id]?.used_quota_usd
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              <tr className="border-t font-medium">
                                <td className="pt-2">{copy.total}</td>
                                <td className="whitespace-nowrap pr-4 pt-2 text-right tabular-nums">
                                  {number(hour.total_requests)}
                                </td>
                                <td className="whitespace-nowrap pt-2 text-right tabular-nums">
                                  {formatUSD(hour.used_quota_usd)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }}
                />
                {orderedSeries.map((model) => (
                  <Bar
                    key={model.id}
                    dataKey={model.id}
                    name={model.model_name}
                    stackId="models"
                    fill={model.color}
                    fillOpacity={
                      highlightedModel && highlightedModel !== model.id
                        ? 0.18
                        : 1
                    }
                    stroke={
                      highlightedModel === model.id ? model.color : undefined
                    }
                    strokeWidth={highlightedModel === model.id ? 1 : 0}
                    maxBarSize={56}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ChartContainer>
            {data.summary.total_requests === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {copy.empty}
              </p>
            )}
            <div
              className="flex max-h-40 flex-wrap gap-2 overflow-y-auto"
              aria-label={copy.models}
            >
              {orderedSeries.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  aria-pressed={highlightedModel === model.id}
                  title={model.model_name}
                  data-model-id={model.id}
                  onClick={() =>
                    setSelectedModel((old) =>
                      old === model.id ? null : model.id
                    )
                  }
                  className={cn(
                    'flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    highlightedModel === model.id && 'bg-muted font-semibold',
                    highlightedModel &&
                      highlightedModel !== model.id &&
                      'opacity-50'
                  )}
                  style={{
                    borderColor:
                      highlightedModel === model.id ? model.color : undefined
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: model.color }}
                  />
                  <span className="max-w-60 truncate">{model.model_name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {copy.order[metric]} {copy.totalsNote}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
});
