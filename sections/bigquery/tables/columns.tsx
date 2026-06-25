'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

export type AuditSummary = {
  event_time: string;
  x_request_id: string;
  user_id: number;
  username: string;
  channel_id: number;
  token_name: string;
  origin_model: string;
  actual_model: string;
  is_stream: boolean;
  status_code: number;
  duration_ms: number;
  dropped_note: string;
};

function formatTime(timeStr: string): string {
  if (!timeStr) return '-';
  const d = new Date(timeStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getStatusVariant(
  code: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (code >= 200 && code < 300) return 'default';
  if (code >= 400 && code < 500) return 'secondary';
  if (code >= 500) return 'destructive';
  return 'outline';
}

export const columns: ColumnDef<AuditSummary>[] = [
  {
    accessorKey: 'event_time',
    header: '时间',
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {formatTime(row.getValue('event_time'))}
      </span>
    )
  },
  {
    accessorKey: 'x_request_id',
    header: 'Request ID',
    cell: ({ row }) => (
      <span className="block max-w-[180px] truncate font-mono text-xs">
        {row.getValue('x_request_id')}
      </span>
    )
  },
  {
    accessorKey: 'username',
    header: '用户'
  },
  {
    accessorKey: 'actual_model',
    header: '模型',
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue('actual_model')}</span>
    )
  },
  {
    accessorKey: 'channel_id',
    header: '渠道'
  },
  {
    accessorKey: 'status_code',
    header: '状态',
    cell: ({ row }) => {
      const code = row.getValue('status_code') as number;
      return <Badge variant={getStatusVariant(code)}>{code}</Badge>;
    }
  },
  {
    accessorKey: 'duration_ms',
    header: '耗时',
    cell: ({ row }) => {
      const ms = row.getValue('duration_ms') as number;
      if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
      return `${ms}ms`;
    }
  },
  {
    accessorKey: 'is_stream',
    header: '流式',
    cell: ({ row }) => (row.getValue('is_stream') ? '是' : '否')
  },
  {
    accessorKey: 'token_name',
    header: 'Token'
  }
];
