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
    header: 'Time',
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at');
      return (
        <span>
          {dayjs(Number(timestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      );
    }
  },
  // 管理员
  {
    accessorKey: 'channel',
    header: 'Channel'
  },
  {
    accessorKey: 'username',
    header: 'User'
  },
  {
    accessorKey: 'token_name',
    header: 'Token'
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => renderType(row.getValue('type'))
  },
  {
    accessorKey: 'model_name',
    header: 'Model'
  },
  {
    accessorKey: 'prompt_tokens',
    header: 'Prompt'
  },
  {
    accessorKey: 'completion_tokens',
    header: 'Complement'
  },
  {
    accessorKey: 'quota',
    header: 'Quota',
    cell: ({ row }) => processQuota(row.getValue('quota'))
  },
  {
    accessorKey: 'duration',
    header: 'Time Consuming'
  },
  // 管理员
  {
    accessorKey: 'content',
    header: 'Details'
  }
];
