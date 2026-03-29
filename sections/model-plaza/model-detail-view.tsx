'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { get } from '@/app/lib/clientFetch';
import { useLocale } from '@/components/providers/locale-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import MetricCard from './components/metric-card';
import MetricsChart from './components/metrics-chart';
import StatusBadge from './components/status-badge';
import TimeRangeSelector from './components/time-range-selector';
import ChannelDetailTable from './components/channel-detail-table';

import type {
  ModelMetricsDetail,
  MetricsTimeSeriesPoint,
  MetricsPeriod,
  ChannelMetrics
} from '@/lib/types/model-metrics';

const isAdmin = (role: unknown) => [10, 100].includes(Number(role));

// Provider 颜色映射（复用列表页配色）
const providerColors: Record<string, string> = {
  OpenAI:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Anthropic:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Google: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  DeepSeek:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  xAI: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
  Meta: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
};

function formatTimestamp(ts: number, period: MetricsPeriod): string {
  const date = new Date(ts * 1000);
  if (period === '1h' || period === '24h') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatPrice(price: number): string {
  if (price === 0) return '$0';
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

export default function ModelDetailView() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLocale();
  useDocumentTitle('模型详情');

  const modelName = decodeURIComponent(params.model as string);
  const userIsAdmin = session?.user?.role ? isAdmin(session.user.role) : false;

  const [detail, setDetail] = useState<ModelMetricsDetail | null>(null);
  const [timeSeries, setTimeSeries] = useState<MetricsTimeSeriesPoint[]>([]);
  const [period, setPeriod] = useState<MetricsPeriod>('24h');
  const [loading, setLoading] = useState(true);
  const [tsLoading, setTsLoading] = useState(true);

  // Fetch detail
  const fetchDetail = useCallback(async () => {
    try {
      const res: any = await get('/api/model-plaza/metrics/detail', {
        model_name: modelName
      });
      if (res?.success && res.data) {
        setDetail(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [modelName]);

  // Fetch time series
  const fetchTimeSeries = useCallback(async () => {
    setTsLoading(true);
    try {
      const res: any = await get('/api/model-plaza/metrics/timeseries', {
        model_name: modelName,
        period
      });
      if (res?.success && res.data?.points) {
        setTimeSeries(res.data.points);
      }
    } catch {
      // ignore
    } finally {
      setTsLoading(false);
    }
  }, [modelName, period]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    fetchTimeSeries();
  }, [fetchTimeSeries]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchDetail();
        fetchTimeSeries();
      },
      5 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [fetchDetail, fetchTimeSeries]);

  const current = detail?.current;
  const period24h = detail?.period_24h;
  const pricing = detail?.pricing;

  const providerBadgeClass =
    providerColors[detail?.provider || ''] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';

  // Prepare chart data
  const chartData = timeSeries.map((p) => ({
    time: formatTimestamp(p.timestamp, period),
    latency: Number(p.avg_latency.toFixed(2)),
    speed: Number(p.avg_speed.toFixed(1)),
    success_rate: Number((p.success_rate * 100).toFixed(1)),
    requests: p.total_requests,
    prompt_tokens: p.prompt_tokens,
    completion_tokens: p.completion_tokens
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3"
          onClick={() => router.push('/model-plaza')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t.modelDetail?.back || 'Back'}
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{modelName}</h1>
          {detail?.provider && (
            <Badge variant="secondary" className={providerBadgeClass}>
              {detail.provider}
            </Badge>
          )}
          {detail && current && (
            <StatusBadge
              status={
                current.success_rate >= 0.95
                  ? 'healthy'
                  : current.success_rate >= 0.8
                  ? 'degraded'
                  : 'down'
              }
              showLabel
            />
          )}
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {detail?.provider?.toLowerCase() || ''}/{modelName}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Pricing summary */}
          {pricing && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                title={t.modelDetail?.inputPrice || 'Input Price'}
                value={
                  pricing.price_type === 'fixed'
                    ? formatPrice(pricing.base_fixed_price)
                    : `${formatPrice(pricing.base_input_price)}/M`
                }
              />
              <MetricCard
                title={t.modelDetail?.outputPrice || 'Output Price'}
                value={
                  pricing.price_type === 'fixed'
                    ? '-'
                    : `${formatPrice(pricing.base_output_price)}/M`
                }
              />
              <MetricCard
                title={t.modelDetail?.priceType || 'Type'}
                value={pricing.price_type === 'fixed' ? 'Per Call' : 'Token'}
              />
              <MetricCard
                title={t.modelDetail?.requests24h || '24h Requests'}
                value={
                  period24h ? period24h.total_requests.toLocaleString() : '0'
                }
              />
            </div>
          )}

          {/* Performance metrics */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {t.modelDetail?.performance || 'Performance'}
            </h2>
            <div className="flex items-center gap-2">
              <TimeRangeSelector value={period} onChange={setPeriod} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  fetchDetail();
                  fetchTimeSeries();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Metric cards row 1 */}
          {current && (
            <>
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  title={t.modelDetail?.successRate || 'Success Rate'}
                  value={`${(current.success_rate * 100).toFixed(1)}%`}
                />
                <MetricCard
                  title={t.modelDetail?.avgLatency || 'Avg Latency'}
                  value={`${current.avg_latency.toFixed(2)}s`}
                />
                <MetricCard
                  title={t.modelDetail?.avgSpeed || 'Avg Speed'}
                  value={`${current.avg_speed.toFixed(1)} t/s`}
                />
                <MetricCard title="RPM" value={current.rpm.toFixed(1)} />
              </div>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  title="P50"
                  value={`${current.p50_latency.toFixed(2)}s`}
                />
                <MetricCard
                  title="P95"
                  value={`${current.p95_latency.toFixed(2)}s`}
                />
                <MetricCard
                  title="P99"
                  value={`${current.p99_latency.toFixed(2)}s`}
                />
                <MetricCard
                  title="TTFT"
                  value={`${current.avg_first_word.toFixed(2)}s`}
                  subtitle={t.modelDetail?.ttftDesc || 'First Token'}
                />
              </div>
            </>
          )}

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="space-y-4">
              {/* Latency trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.modelDetail?.latencyTrend || 'Latency Trend'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricsChart
                    type="area"
                    data={chartData}
                    dataKeys={[
                      {
                        key: 'latency',
                        label: t.modelDetail?.avgLatency || 'Avg Latency',
                        color: 'hsl(var(--chart-1))'
                      }
                    ]}
                    xAxisKey="time"
                    yAxisFormatter={(v) => `${v}s`}
                  />
                </CardContent>
              </Card>

              {/* Speed + Success rate side by side */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t.modelDetail?.speedTrend || 'Speed (TPS)'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetricsChart
                      type="area"
                      data={chartData}
                      dataKeys={[
                        {
                          key: 'speed',
                          label: t.modelDetail?.avgSpeed || 'Speed',
                          color: 'hsl(var(--chart-2))'
                        }
                      ]}
                      xAxisKey="time"
                      yAxisFormatter={(v) => `${v}`}
                      height={200}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t.modelDetail?.successRateTrend || 'Success Rate'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetricsChart
                      type="area"
                      data={chartData}
                      dataKeys={[
                        {
                          key: 'success_rate',
                          label: t.modelDetail?.successRate || 'Success Rate',
                          color: 'hsl(var(--chart-3))'
                        }
                      ]}
                      xAxisKey="time"
                      yAxisFormatter={(v) => `${v}%`}
                      height={200}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Token usage */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.modelDetail?.tokenUsage || 'Token Usage'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricsChart
                    type="bar"
                    data={chartData}
                    dataKeys={[
                      {
                        key: 'prompt_tokens',
                        label: 'Prompt',
                        color: 'hsl(var(--chart-4))',
                        stacked: true
                      },
                      {
                        key: 'completion_tokens',
                        label: 'Completion',
                        color: 'hsl(var(--chart-5))',
                        stacked: true
                      }
                    ]}
                    xAxisKey="time"
                    yAxisFormatter={(v) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : `${v}`
                    }
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pricing detail table */}
          {pricing &&
            pricing.group_prices &&
            pricing.group_prices.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t.modelDetail?.pricingDetail || 'Pricing Detail'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium text-muted-foreground">
                            {t.modelDetail?.userTier || 'Tier'}
                          </th>
                          <th className="pb-2 text-right font-medium text-muted-foreground">
                            {t.modelDetail?.inputPrice || 'Input'}
                          </th>
                          <th className="pb-2 text-right font-medium text-muted-foreground">
                            {t.modelDetail?.outputPrice || 'Output'}
                          </th>
                          <th className="pb-2 text-right font-medium text-muted-foreground">
                            {t.modelPlaza?.discount || 'Discount'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricing.group_prices.map((gp) => (
                          <tr
                            key={gp.group_key}
                            className="border-b last:border-0"
                          >
                            <td className="py-2">{gp.display_name}</td>
                            <td className="py-2 text-right">
                              {pricing.price_type === 'fixed'
                                ? formatPrice(gp.final_fixed_price)
                                : `${formatPrice(gp.final_input_price)}/M`}
                            </td>
                            <td className="py-2 text-right">
                              {pricing.price_type === 'fixed'
                                ? '-'
                                : `${formatPrice(gp.final_output_price)}/M`}
                            </td>
                            <td className="py-2 text-right">
                              {gp.combined_discount < 1
                                ? `${Math.round(
                                    (1 - gp.combined_discount) * 100
                                  )}% OFF`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Admin channel detail */}
          {/* 渠道明细：仅当后端返回 channels 时显示（后端已做权限校验） */}
          {detail?.channels !== undefined && detail?.channels !== null && (
            <div className="mt-4">
              <ChannelDetailTable channels={detail.channels} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
