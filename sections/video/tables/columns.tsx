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
import { VideoStat } from '@/lib/types/video';
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

export const columns: ColumnDef<VideoStat>[] = [
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
    accessorKey: 'type',
    header: () => <div className="text-center">Type</div>,
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className="text-center">
          <CopyableCell value={type} label="类型">
            <div className="text-sm">{type}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
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
    accessorKey: 'duration',
    header: () => <div className="text-center">Duration</div>,
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number;
      return (
        <div className="text-center">
          <CopyableCell value={duration} label="时长">
            <div className="text-sm font-medium">{duration}s</div>
          </CopyableCell>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  // {
  //   accessorKey: 'progress',
  //   header: () => <div className="text-center">Progress</div>,
  //   cell: ({ row }) => (
  //     <div className="text-center">
  //       <div className="text-center">{row.getValue('progress')}</div>
  //       <Progress value={parseInt(row.getValue('progress'), 10)} />
  //     </div>
  //   )
  // },
  // {
  //   id: 'Duration',
  //   header: () => <div className="text-center">Duration</div>,
  //   cell: ({ row }) => {
  //     const finishTime = row.original.finish_time;
  //     const startTime = row.original.start_time;
  //     const duration =
  //       finishTime === 0 || startTime === 0
  //         ? 0
  //         : (finishTime - startTime) / 1000;
  //     return <div className="text-center">{duration}s</div>;
  //   }
  // },
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
    accessorKey: 'prompt',
    header: () => <div className="text-center">Prompt</div>,
    cell: ({ row }) => {
      const prompt = row.getValue('prompt') as string;
      return (
        <div className="text-center">
          <CopyableCell value={prompt} label="提示词">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="max-w-[200px] truncate px-2 text-sm">
                    {prompt || '-'}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[400px] break-words">
                    {prompt || '无提示词'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    size: 250,
    minSize: 200,
    maxSize: 300
  }
  // {
  //   accessorKey: 'image_url',
  //   header: () => <div className="text-center">Image</div>,
  //   cell: ({ row }) => (
  //     <div className="flex justify-center gap-2">
  //       <TooltipProvider>
  //         <Tooltip delayDuration={100}>
  //           <TooltipTrigger>
  //             <a
  //               href={row.getValue('image_url')}
  //               target="_blank"
  //               rel="noopener noreferrer"
  //             >
  //               <div className="line-clamp-3 max-w-[200px] text-center">
  //                 {row.getValue('image_url')}
  //               </div>
  //             </a>
  //           </TooltipTrigger>
  //           <TooltipContent>
  //             <div className="max-w-[300px] break-words text-center">
  //               {row.getValue('image_url')}
  //             </div>
  //           </TooltipContent>
  //         </Tooltip>
  //       </TooltipProvider>
  //     </div>
  //   )
  // },
  // {
  //   accessorKey: 'prompt_en',
  //   header: () => <div className="text-center">Prompt</div>,
  //   cell: ({ row }) => (
  //     <div className="flex justify-center gap-2">
  //       <TooltipProvider>
  //         <Tooltip delayDuration={100}>
  //           <TooltipTrigger>
  //             <div className="line-clamp-3 max-w-[200px] text-center">
  //               {row.getValue('prompt_en')}
  //             </div>
  //           </TooltipTrigger>
  //           <TooltipContent>
  //             <div className="max-w-[300px] break-words text-center">
  //               {row.getValue('prompt_en')}
  //             </div>
  //           </TooltipContent>
  //         </Tooltip>
  //       </TooltipProvider>
  //     </div>
  //   )
  // },
  // {
  //   accessorKey: 'fail_reason',
  //   header: () => <div className="text-center">Failure Reason</div>,
  //   cell: ({ row }) => (
  //     <div className="flex justify-center gap-2">
  //       <TooltipProvider>
  //         <Tooltip delayDuration={100}>
  //           <TooltipTrigger>
  //             <div className="line-clamp-3 max-w-[200px] text-center">
  //               {row.getValue('fail_reason')}
  //             </div>
  //           </TooltipTrigger>
  //           <TooltipContent>
  //             <div className="max-w-[300px] break-words text-center">
  //               {row.getValue('fail_reason')}
  //             </div>
  //           </TooltipContent>
  //         </Tooltip>
  //       </TooltipProvider>
  //     </div>
  //   )
  // },
  // {
  //   accessorKey: 'quota',
  //   header: () => <div className="text-center">Price</div>,
  //   cell: ({ row }) => (
  //     <div className="text-center">{processQuota(row.getValue('quota'))}</div>
  //   )
  // }
];
