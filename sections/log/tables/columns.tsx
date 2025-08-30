'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { LogStat } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

/** 类型 */
const renderType = (status: number) => {
  switch (status) {
    case 1:
      return <span>Top up</span>;
    case 2:
      return <span>Consumption</span>;
    case 3:
      return <span>Management</span>;
    case 4:
      return <span>System</span>;
    default:
      return <span>Unknown</span>;
  }
};

const processQuota = (quota: number) => {
  // 将quota除以500000，并保留小数点后六位
  const processedQuota = (quota / 500000).toFixed(6);
  // 转换为数值类型，以便去除多余的零
  return `$${parseFloat(processedQuota)}`;
};

export const columns: ColumnDef<LogStat>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'created_at',
    header: () => <div className="text-center">Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at');
      return (
        <div className="text-center">
          {dayjs(Number(timestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      );
    }
  },
  // 管理员
  {
    id: 'channel',
    accessorKey: 'channel',
    header: () => <div className="text-center">Channel</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('channel')}</div>
    )
  },
  {
    accessorKey: 'username',
    header: () => <div className="text-center">User</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('username')}</div>
    )
  },
  {
    accessorKey: 'token_name',
    header: () => <div className="text-center">Token</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('token_name')}</div>
    )
  },
  {
    accessorKey: 'type',
    header: () => <div className="text-center">Type</div>,
    cell: ({ row }) => (
      <div className="text-center">{renderType(row.getValue('type'))}</div>
    )
  },
  {
    accessorKey: 'model_name',
    header: () => <div className="text-center">Model</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('model_name')}</div>
    )
  },
  {
    accessorKey: 'prompt_tokens',
    header: () => <div className="text-center">Prompt</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('prompt_tokens')}</div>
    )
  },
  {
    accessorKey: 'completion_tokens',
    header: () => <div className="text-center">Complement</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('completion_tokens')}</div>
    )
  },
  {
    accessorKey: 'quota',
    header: () => <div className="text-center">Quota</div>,
    cell: ({ row }) => (
      <div className="text-center">{processQuota(row.getValue('quota'))}</div>
    )
  },
  {
    accessorKey: 'duration',
    header: () => <div className="text-center">用时/首字</div>,
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number;
      // 修复：处理数据库中的数字类型（1/0）转换为布尔值
      const isStreamValue = row.original.is_stream;
      const isStream = isStreamValue === 1 || isStreamValue === true;

      // 修复：处理首字延迟字段名
      const firstWordLatencyValue = row.original.first_word_latency;
      const firstWordLatency =
        typeof firstWordLatencyValue === 'number' ? firstWordLatencyValue : 0;

      return (
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <span>{duration}</span>
            {isStream && (
              <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                流
              </span>
            )}
          </div>
          {isStream && firstWordLatency > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    {firstWordLatency.toFixed(2)}s
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>首字延迟: {firstWordLatency.toFixed(3)}秒</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }
  },
  {
    id: 'content',
    accessorKey: 'content',
    header: () => <div className="text-center">Details</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('content')}</div>
    )
  }
];
