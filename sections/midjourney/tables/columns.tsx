'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { MidjourneyStat } from '@/lib/types/midjourney';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { CopyableCell } from '@/components/ui/copyable-cell';

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

export const columns: ColumnDef<MidjourneyStat>[] = [
  {
    accessorKey: 'submit_time',
    header: () => <div className="text-center">Submission Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('submit_time');
      const formattedTime = dayjs(Number(timestamp)).format(
        'YYYY-MM-DD HH:mm:ss'
      );
      return (
        <div className="text-center">
          <CopyableCell value={formattedTime} label="提交时间">
            {formattedTime}
          </CopyableCell>
        </div>
      );
    }
  },
  // 管理员
  {
    accessorKey: 'action',
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => {
      const action = row.getValue('action') as string;
      return (
        <div className="text-center">
          <CopyableCell value={action} label="操作">
            {action}
          </CopyableCell>
        </div>
      );
    }
  },
  {
    accessorKey: 'mj_id',
    header: () => <div className="text-center">Task Id</div>,
    cell: ({ row }) => {
      const mjId = row.getValue('mj_id') as string;
      return (
        <div className="text-center">
          <CopyableCell value={mjId} label="任务ID">
            {mjId}
          </CopyableCell>
        </div>
      );
    }
  },
  {
    accessorKey: 'type',
    header: () => <div className="text-center">Type</div>,
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className="text-center">
          <CopyableCell value={type} label="类型">
            {type}
          </CopyableCell>
        </div>
      );
    }
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <div className="text-center">
          <CopyableCell value={status} label="状态">
            {status}
          </CopyableCell>
        </div>
      );
    }
  },
  {
    accessorKey: 'progress',
    header: () => <div className="text-center">Progress</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <div className="text-center">{row.getValue('progress')}</div>
        <Progress value={parseInt(row.getValue('progress'), 10)} />
      </div>
    )
  },
  {
    id: 'Duration',
    header: () => <div className="text-center">Duration</div>,
    cell: ({ row }) => {
      const finishTime = row.original.finish_time;
      const startTime = row.original.start_time;
      const duration =
        finishTime === 0 || startTime === 0
          ? 0
          : (finishTime - startTime) / 1000;
      const durationText = `${duration}s`;
      return (
        <div className="text-center">
          <CopyableCell value={durationText} label="持续时间">
            {durationText}
          </CopyableCell>
        </div>
      );
    }
  },
  {
    accessorKey: 'image_url',
    header: () => <div className="text-center">Image</div>,
    cell: ({ row }) => {
      const imageUrl = row.getValue('image_url') as string;
      return (
        <div className="flex justify-center gap-2">
          <CopyableCell value={imageUrl || ''} label="图片链接">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <div className="line-clamp-3 max-w-[200px] text-center">
                      {imageUrl || '无图片'}
                    </div>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[300px] break-words text-center">
                    {imageUrl || '无图片链接'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    }
  },
  {
    accessorKey: 'prompt_en',
    header: () => <div className="text-center">Prompt</div>,
    cell: ({ row }) => {
      const prompt = row.getValue('prompt_en') as string;
      return (
        <div className="flex justify-center gap-2">
          <CopyableCell value={prompt || ''} label="提示词">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="line-clamp-3 max-w-[200px] text-center">
                    {prompt || '-'}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[300px] break-words text-center">
                    {prompt || '无提示词'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    }
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
                  <div className="line-clamp-3 max-w-[200px] text-center">
                    {failReason || '-'}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[300px] break-words text-center">
                    {failReason || '无失败原因'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    }
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
            {processedQuota}
          </CopyableCell>
        </div>
      );
    }
  }
];
