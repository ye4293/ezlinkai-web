'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { ImageStat } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

const processQuota = (quota: number) => {
  // 将quota除以500000，并保留小数点后六位
  const processedQuota = (quota / 500000).toFixed(6);
  // 转换为数值类型，以便去除多余的零
  return `$${parseFloat(processedQuota)}`;
};

export const columns: ColumnDef<ImageStat>[] = [
  {
    accessorKey: 'task_id',
    header: () => <div className="text-center">Task ID</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('task_id')}</div>
    )
  },
  {
    accessorKey: 'created_at',
    header: () => <div className="text-center">Created Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at');
      return (
        <div className="text-center">
          {dayjs(Number(timestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      );
    }
  },
  {
    accessorKey: 'provider',
    header: () => <div className="text-center">Provider</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('provider')}</div>
    )
  },
  {
    accessorKey: 'model',
    header: () => <div className="text-center">Model</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('model')}</div>
    )
  },
  {
    accessorKey: 'mode',
    header: () => <div className="text-center">Mode</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('mode')}</div>
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('status')}</div>
    )
  },
  {
    accessorKey: 'n',
    header: () => <div className="text-center">Count</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('n')}</div>
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: () => <div className="text-center">Username</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('username')}</div>
    )
  },
  {
    id: 'channel_id',
    accessorKey: 'channel_id',
    header: () => <div className="text-center">Channel ID</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('channel_id')}</div>
    )
  },
  {
    id: 'user_id',
    accessorKey: 'user_id',
    header: () => <div className="text-center">User ID</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('user_id')}</div>
    )
  },
  {
    accessorKey: 'store_url',
    header: () => <div className="text-center">Image</div>,
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <a
                href={row.getValue('store_url')}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="line-clamp-3 max-w-[200px] text-center">
                  {row.getValue('store_url') ? '查看图片' : '暂无图片'}
                </div>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[300px] break-words text-center">
                {row.getValue('store_url')}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  },
  {
    accessorKey: 'fail_reason',
    header: () => <div className="text-center">Failure Reason</div>,
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <div className="line-clamp-3 max-w-[200px] text-center">
                {row.getValue('fail_reason') || '-'}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[300px] break-words text-center">
                {row.getValue('fail_reason') || '无失败原因'}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  },
  {
    accessorKey: 'quota',
    header: () => <div className="text-center">Price</div>,
    cell: ({ row }) => (
      <div className="text-center">{processQuota(row.getValue('quota'))}</div>
    )
  }
];
