'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { LogStatSummary } from '@/lib/types/log-stat';

interface SummaryCardsProps {
  summary: LogStatSummary;
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  return `${seconds.toFixed(2)}s`;
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)} t/s`;
}

function formatRate(success: number, total: number): string {
  if (total === 0) return '-';
  return `${((success / total) * 100).toFixed(1)}%`;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Requests',
      value: summary.total_requests.toLocaleString(),
      sub: `${summary.error_count} errors`
    },
    {
      title: 'Avg Duration',
      value: formatDuration(summary.avg_duration),
      sub: `P50: ${formatDuration(summary.p50_duration)}`
    },
    {
      title: 'P95 Duration',
      value: formatDuration(summary.p95_duration),
      sub: `P99: ${formatDuration(summary.p99_duration)}`
    },
    {
      title: 'Avg Speed',
      value: formatSpeed(summary.avg_speed),
      sub: `First word: ${formatDuration(summary.avg_first_word_latency)}`
    },
    {
      title: 'Success Rate',
      value: formatRate(summary.success_count, summary.total_requests),
      sub: `${summary.success_count.toLocaleString()} / ${summary.total_requests.toLocaleString()}`
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {card.title}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {card.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
