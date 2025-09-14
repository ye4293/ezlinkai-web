'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
// import { Toaster } from '@/components/ui/toaster';
import { Toaster, toast } from 'sonner';
import { UserSelf } from '@/lib/types/user';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { renderQuota, renderNumber } from '@/utils/render';

const renderStatus = (status: number) => {
  switch (status) {
    case 1:
      return 'Activated';
    case 2:
      return 'Disabled';
    default:
      return 'Unknown status';
  }
};

/** 角色 */
const renderRole = (role: number) => {
  switch (role) {
    case 1:
      return 'User';
    case 10:
      return 'Admin';
    case 100:
      return 'Root';
    default:
      return 'Unknown identity';
  }
};

export const columns: ColumnDef<UserSelf>[] = [
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
    accessorKey: 'username',
    header: () => <div className="text-center">Username</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('username')}</div>
    )
  },
  {
    accessorKey: 'display_name',
    header: () => <div className="text-center">Display name</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('display_name')}</div>
    )
  },
  {
    accessorKey: 'email',
    header: () => <div className="text-center">Email</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('email')}</div>
    )
  },
  {
    accessorKey: 'group',
    header: () => <div className="text-center">Group</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('group')}</div>
    )
  },
  {
    id: 'statistics',
    header: () => <div className="text-center">Statistics</div>,
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button>{renderQuota(row.original.quota)}</Button>
            </TooltipTrigger>
            <TooltipContent>Balance</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button>{renderQuota(row.original.used_quota)}</Button>
            </TooltipTrigger>
            <TooltipContent>Used quota</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button>{renderNumber(row.original.request_count)}</Button>
            </TooltipTrigger>
            <TooltipContent>Request times</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  },
  {
    accessorKey: 'role',
    header: () => <div className="text-center">User role</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">{renderRole(row.getValue('role'))}</div>
      );
    }
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => (
      <div className="text-center">{renderStatus(row.getValue('status'))}</div>
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
