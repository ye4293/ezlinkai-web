'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
// import { Channel } from '@/constants/data';
import { Channel } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { CHANNEL_OPTIONS } from '@/constants';
import { renderNumber } from '@/utils/render';

const renderStatus = (status: number) => {
  switch (status) {
    case 1:
      return 'Enabled';
    case 2:
      return 'Disabled';
    case 3:
      return 'Disabled';
    default:
      return 'Unknown status';
  }
};

const renderResponseTime = (test_time: number, response_time: number) => {
  let time: string | number = response_time / 1000;
  time = time.toFixed(2) + ' ' + 's';
  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span>{time}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {test_time
            ? dayjs(test_time * 1000).format('YYYY-MM-DD HH:mm:ss')
            : 'Not tested'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const renderBalance = (type: number, balance: number) => {
  switch (type) {
    case 1: // OpenAI
      return <span>${balance.toFixed(2)}</span>;
    case 4: // CloseAI
      return <span>¥{balance.toFixed(2)}</span>;
    case 8: // 自定义
      return <span>${balance.toFixed(2)}</span>;
    case 5: // OpenAI-SB
      return <span>¥{(balance / 10000).toFixed(2)}</span>;
    case 10: // AI Proxy
      return <span>{renderNumber(balance)}</span>;
    case 12: // API2GPT
      return <span>¥{balance.toFixed(2)}</span>;
    case 13: // AIGC2D
      return <span>{renderNumber(balance)}</span>;
    default:
      return <span>Not supported</span>;
  }
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
    accessorKey: 'id',
    header: () => <div className="text-center">ID</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('id')}</div>
  },
  {
    accessorKey: 'name',
    header: () => <div className="text-center">Name</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('name')}</div>
  },
  {
    accessorKey: 'group',
    header: () => <div className="text-center">Group</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('group')}</div>
    )
  },
  {
    accessorKey: 'type',
    header: () => <div className="text-center">Type</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {
          [...CHANNEL_OPTIONS].filter(
            (item) => item.key === row.getValue('type')
          )[0]?.text
        }
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => (
      <div className="text-center">{renderStatus(row.getValue('status'))}</div>
    )
  },
  {
    accessorKey: 'response_time',
    header: () => <div className="text-center">Response time</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {renderResponseTime(
          row.original.test_time as number,
          row.getValue('response_time') as number
        )}
      </div>
    )
  },
  {
    accessorKey: 'balance',
    header: () => <div className="text-center">Balance</div>,
    cell: ({ row }) =>
      renderBalance(row.getValue('type'), row.getValue('balance'))
  },
  {
    accessorKey: 'priority',
    header: () => <div className="text-center">Priority</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('priority')}</div>
    )
  },
  {
    accessorKey: 'weight',
    header: () => <div className="text-center">Weight</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('weight')}</div>
    )
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <CellAction data={row.original} />
      </div>
    )
  }
];
