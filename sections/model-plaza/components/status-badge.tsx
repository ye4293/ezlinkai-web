'use client';

import { useLocale } from '@/components/providers/locale-provider';

interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'down' | 'no_data';
  showLabel?: boolean;
}

const statusConfig = {
  healthy: { color: 'bg-green-500', labelKey: 'healthy' as const },
  degraded: { color: 'bg-yellow-500', labelKey: 'degraded' as const },
  down: { color: 'bg-red-500', labelKey: 'down' as const },
  no_data: { color: 'bg-gray-400', labelKey: 'noData' as const }
};

const fallbackLabels: Record<string, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
  noData: 'No Data'
};

export default function StatusBadge({
  status,
  showLabel = false
}: StatusBadgeProps) {
  const { t } = useLocale();
  const cfg = statusConfig[status] || statusConfig.no_data;
  const label = t.modelDetail?.[cfg.labelKey] || fallbackLabels[cfg.labelKey];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${cfg.color}`} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
