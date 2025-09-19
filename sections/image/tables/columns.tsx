'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { ImageStat } from '@/lib/types/image';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { CopyableCell } from '@/components/ui/copyable-cell';

const processQuota = (quota: number) => {
  // 将quota除以500000，并保留小数点后六位
  const processedQuota = (quota / 500000).toFixed(6);
  // 转换为数值类型，以便去除多余的零
  return `$${parseFloat(processedQuota)}`;
};

export const columns: ColumnDef<ImageStat>[] = [
  {
    accessorKey: 'created_at',
    header: () => <div className="text-center">Created Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at');
      const formattedTime = dayjs(Number(timestamp) * 1000).format(
        'YYYY-MM-DD HH:mm:ss'
      );
      return (
        <div className="text-center">
          <CopyableCell value={formattedTime} label="时间">
            <div className="text-sm">{formattedTime}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 160,
    minSize: 140,
    maxSize: 180
  },
  {
    id: 'channel_id',
    accessorKey: 'channel_id',
    header: () => <div className="text-center">Channel ID</div>,
    cell: ({ row }) => {
      const channelId = row.getValue('channel_id') as number;
      return (
        <div className="text-center">
          <CopyableCell value={channelId} label="渠道ID">
            <div className="text-sm font-medium">{channelId}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  {
    accessorKey: 'task_id',
    header: () => <div className="text-center">Task ID</div>,
    cell: ({ row }) => {
      const taskId = row.getValue('task_id') as string;
      return (
        <div className="text-center">
          <CopyableCell value={taskId} label="任务ID">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="max-w-[180px] truncate px-2 text-sm">
                    {taskId}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[400px] break-all">{taskId}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    size: 200,
    minSize: 150,
    maxSize: 250
  },
  {
    accessorKey: 'provider',
    header: () => <div className="text-center">Provider</div>,
    cell: ({ row }) => {
      const provider = row.getValue('provider') as string;
      return (
        <div className="text-center">
          <CopyableCell value={provider} label="提供商">
            <div className="text-sm">{provider}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    accessorKey: 'model',
    header: () => <div className="text-center">Model</div>,
    cell: ({ row }) => {
      const model = row.getValue('model') as string;
      return (
        <div className="text-center">
          <CopyableCell value={model} label="模型">
            <div className="text-sm">{model}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 140,
    minSize: 120,
    maxSize: 160
  },
  {
    accessorKey: 'mode',
    header: () => <div className="text-center">Mode</div>,
    cell: ({ row }) => {
      const mode = row.getValue('mode') as string;
      return (
        <div className="text-center">
          <CopyableCell value={mode} label="模式">
            <div className="text-sm">{mode}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const statusColor =
        status === 'succeeded'
          ? 'text-green-600'
          : status === 'submitted'
          ? 'text-blue-600'
          : 'text-red-600';
      return (
        <div className="text-center">
          <CopyableCell value={status} label="状态">
            <div className={`text-sm font-medium ${statusColor}`}>{status}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    accessorKey: 'n',
    header: () => <div className="text-center">Count</div>,
    cell: ({ row }) => {
      const count = row.getValue('n') as number;
      return (
        <div className="text-center">
          <CopyableCell value={count} label="数量">
            <div className="text-sm font-medium">{count}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 80,
    minSize: 60,
    maxSize: 100
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: () => <div className="text-center">Username</div>,
    cell: ({ row }) => {
      const username = row.getValue('username') as string;
      return (
        <div className="text-center">
          <CopyableCell value={username} label="用户名">
            <div className="text-sm">{username}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    id: 'user_id',
    accessorKey: 'user_id',
    header: () => <div className="text-center">User ID</div>,
    cell: ({ row }) => {
      const userId = row.getValue('user_id') as number;
      return (
        <div className="text-center">
          <CopyableCell value={userId} label="用户ID">
            <div className="text-sm font-medium">{userId}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  {
    accessorKey: 'store_url',
    header: () => <div className="text-center">Image</div>,
    cell: ({ row }) => {
      const storeUrl = row.getValue('store_url') as string;
      return (
        <div className="flex justify-center gap-2">
          <CopyableCell value={storeUrl || ''} label="图片链接">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <div className="px-2 text-sm">
                      {storeUrl ? '查看图片' : '暂无图片'}
                    </div>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[300px] break-words">
                    {storeUrl || '无图片链接'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    accessorKey: 'fail_reason',
    header: () => <div className="text-center">Failure Reason</div>,
    cell: ({ row }) => {
      const failReason = row.getValue('fail_reason') as string;
      return (
        <div className="flex justify-center gap-2">
          <CopyableCell value={failReason || ''} label="失败原因">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="max-w-[180px] truncate px-2 text-sm">
                    {failReason || '-'}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[400px] break-words">
                    {failReason || '无失败原因'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    size: 200,
    minSize: 150,
    maxSize: 250
  },
  {
    accessorKey: 'quota',
    header: () => <div className="text-center">Price</div>,
    cell: ({ row }) => {
      const quota = row.getValue('quota') as number;
      const processedQuota = processQuota(quota);
      return (
        <div className="text-center">
          <CopyableCell value={processedQuota} label="价格">
            <div className="text-sm font-medium text-green-600">
              {processedQuota}
            </div>
          </CopyableCell>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120
  }
];
