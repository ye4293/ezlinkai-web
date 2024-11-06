'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Channel } from '@/lib/types';
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

export const columns: ColumnDef<Channel>[] = [
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
    header: () => <div className="text-center">Time Consuming</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('duration')}</div>
    )
  },
  {
    accessorKey: 'content',
    header: () => <div className="text-center">Details</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('content')}</div>
    )
  }
];
