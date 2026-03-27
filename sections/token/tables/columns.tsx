'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Token } from '@/lib/types/token';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { renderQuota } from '@/utils/render';
import { CheckCircle2, Ban, Clock, AlertTriangle } from 'lucide-react';

const statusConfig: Record<
  number,
  { text: string; icon: React.ReactNode; badgeClass: string }
> = {
  1: {
    text: 'Enabled',
    icon: <CheckCircle2 className="h-3 w-3" />,
    badgeClass:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
  },
  2: {
    text: 'Disabled',
    icon: <Ban className="h-3 w-3" />,
    badgeClass:
      'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
  },
  3: {
    text: 'Expired',
    icon: <Clock className="h-3 w-3" />,
    badgeClass:
      'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400'
  },
  4: {
    text: 'Exhausted',
    icon: <AlertTriangle className="h-3 w-3" />,
    badgeClass:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400'
  }
};

const renderStatus = (status: number) => {
  const config = statusConfig[status];
  if (!config) {
    return (
      <Badge variant="outline" className="text-xs">
        Unknown
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs font-medium ${config.badgeClass}`}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
};

export const columns: ColumnDef<Token>[] = [
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
    accessorKey: 'name',
    header: () => <div className="text-center">Name</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('name')}</div>
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        {renderStatus(row.getValue('status'))}
      </div>
    )
  },
  {
    accessorKey: 'used_quota',
    header: () => <div className="text-center">Used</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {renderQuota(row.getValue('used_quota'))}
      </div>
    )
  },
  {
    accessorKey: 'remain_quota',
    header: () => <div className="text-center">Limit</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          {row.original.unlimited_quota
            ? 'Unlimited'
            : renderQuota(row.getValue('remain_quota'))}
        </div>
      );
    }
  },
  {
    accessorKey: 'created_time',
    header: () => <div className="text-center">Created</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('created_time');
      return (
        <div className="text-center">
          {dayjs(Number(timestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      );
    }
  },
  {
    accessorKey: 'expired_time',
    header: () => <div className="text-center">Expired</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('expired_time');
      return (
        <div className="text-center">
          {row.getValue('expired_time') === -1
            ? 'Never expires'
            : dayjs(Number(timestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      );
    }
  },
  {
    id: 'copyToken',
    header: () => <div className="text-center">Copy</div>,
    cell: ({ row }) => {
      const handleCopy = () => {
        navigator.clipboard
          .writeText(row.original.key)
          .then(() => {
            toast.success('Copied to clipboard!');
          })
          .catch(() => {
            toast.error('Failed to copy!');
          });
      };

      return (
        <div className="text-center">
          <Button onClick={handleCopy} className="copy-button">
            Copy
          </Button>
          {/* <Toaster position="top-center" /> */}
        </div>
      );
    }
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
