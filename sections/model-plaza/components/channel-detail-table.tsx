'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import type { ChannelMetrics } from '@/lib/types/model-metrics';
import { useLocale } from '@/components/providers/locale-provider';

interface ChannelDetailTableProps {
  channels: ChannelMetrics[] | null;
}

export default function ChannelDetailTable({
  channels
}: ChannelDetailTableProps) {
  const { t } = useLocale();

  const hasData = channels && channels.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-muted-foreground" />
          {t.modelDetail?.channelDetail || 'Channel Detail'}
          <span className="text-xs font-normal text-muted-foreground">
            ({t.modelDetail?.adminOnly || 'Admin Only'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.modelDetail?.channelName || 'Channel'}</TableHead>
                <TableHead className="text-right">
                  {t.modelDetail?.successRate || 'Success Rate'}
                </TableHead>
                <TableHead className="text-right">
                  {t.modelDetail?.avgLatency || 'Avg Latency'}
                </TableHead>
                <TableHead className="text-right">
                  {t.modelDetail?.avgSpeed || 'Avg Speed'}
                </TableHead>
                <TableHead className="text-right">
                  {t.modelDetail?.requests24h || '24h Requests'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels!.map((ch) => (
                <TableRow key={ch.channel_id}>
                  <TableCell className="font-medium">
                    {ch.channel_name}
                  </TableCell>
                  <TableCell className="text-right">
                    {(ch.success_rate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {ch.avg_latency.toFixed(2)}s
                  </TableCell>
                  <TableCell className="text-right">
                    {ch.avg_speed.toFixed(1)} t/s
                  </TableCell>
                  <TableCell className="text-right">
                    {ch.total_requests_24h.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t.modelDetail?.noData || 'No channel data available yet'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
