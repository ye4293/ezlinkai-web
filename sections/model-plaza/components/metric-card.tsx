'use client';

import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
