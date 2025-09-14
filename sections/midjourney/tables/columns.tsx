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
      return (
        <div className="text-center">
          {dayjs(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      );
    }
  },
  // 管理员
  {
    accessorKey: 'action',
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('action')}</div>
    )
  },
  {
    accessorKey: 'mj_id',
    header: () => <div className="text-center">Task Id</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('mj_id')}</div>
    )
  },
  {
    accessorKey: 'type',
    header: () => <div className="text-center">Type</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('type')}</div>
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('status')}</div>
    )
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
      return <div className="text-center">{duration}s</div>;
    }
  },
  {
    accessorKey: 'image_url',
    header: () => <div className="text-center">Image</div>,
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <a
                href={row.getValue('image_url')}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="line-clamp-3 max-w-[200px] text-center">
                  {row.getValue('image_url')}
                </div>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[300px] break-words text-center">
                {row.getValue('image_url')}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  },
  {
    accessorKey: 'prompt_en',
    header: () => <div className="text-center">Prompt</div>,
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <div className="line-clamp-3 max-w-[200px] text-center">
                {row.getValue('prompt_en')}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[300px] break-words text-center">
                {row.getValue('prompt_en')}
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
                {row.getValue('fail_reason')}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[300px] break-words text-center">
                {row.getValue('fail_reason')}
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
