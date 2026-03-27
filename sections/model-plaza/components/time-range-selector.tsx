'use client';

import { Button } from '@/components/ui/button';
import type { MetricsPeriod } from '@/lib/types/model-metrics';

interface TimeRangeSelectorProps {
  value: MetricsPeriod;
  onChange: (value: MetricsPeriod) => void;
}

const periods: { value: MetricsPeriod; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' }
];

export default function TimeRangeSelector({
  value,
  onChange
}: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={value === p.value ? 'default' : 'outline'}
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
