'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
// import { Toaster } from '@/components/ui/toaster';
// import { Toaster, toast } from 'sonner';
import { toast } from 'sonner';
import { Token } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { renderQuota } from '@/utils/render';

const renderStatus = (status: number) => {
  switch (status) {
    case 1:
      return 'Enabled';
    case 2:
      return 'Disabled';
    case 3:
      return 'Expired';
    case 4:
      return 'Exhausted';
    default:
      return 'Unknown status';
  }
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
      <div className="text-center">{renderStatus(row.getValue('status'))}</div>
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
