'use client';
import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserSelf } from '@/lib/types/user';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { renderQuota, renderNumber } from '@/utils/render';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

const ROLE_STYLE: Record<number, string> = {
  1: 'bg-muted text-foreground/80',
  10: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  100: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
};

export const useUserColumns = (): ColumnDef<UserSelf>[] => {
  const { t } = useLocale();

  const renderRole = (role: number) => {
    switch (role) {
      case 1:
        return t.userPage.role.user;
      case 10:
        return t.userPage.role.admin;
      case 100:
        return t.userPage.role.root;
      default:
        return t.userPage.role.unknown;
    }
  };

  return useMemo<ColumnDef<UserSelf>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
        header: () => (
          <div className="text-center">{t.userPage.columns.id}</div>
        ),
        cell: ({ row }) => (
          <div className="text-center tabular-nums text-muted-foreground">
            {row.getValue('id')}
          </div>
        )
      },
      {
        accessorKey: 'username',
        header: t.userPage.columns.username,
        cell: ({ row }) => {
          const username = row.getValue<string>('username');
          const display = row.original.display_name;
          return (
            <div className="min-w-0">
              <div className="truncate font-medium">{username}</div>
              {display && display !== username && (
                <div className="truncate text-xs text-muted-foreground">
                  {display}
                </div>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: 'email',
        header: t.userPage.columns.email,
        cell: ({ row }) => (
          <div className="truncate text-muted-foreground">
            {row.getValue('email') || '—'}
          </div>
        )
      },
      {
        accessorKey: 'group',
        header: () => (
          <div className="text-center">{t.userPage.columns.group}</div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="outline" className="font-normal">
              {row.getValue('group') || '—'}
            </Badge>
          </div>
        )
      },
      {
        id: 'statistics',
        header: () => (
          <div className="text-center">{t.userPage.columns.statistics}</div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center gap-4 text-xs tabular-nums">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.userPage.stats.balance}
              </div>
              <div className="font-medium">
                {renderQuota(row.original.quota)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.userPage.stats.used}
              </div>
              <div className="font-medium">
                {renderQuota(row.original.used_quota)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.userPage.stats.requests}
              </div>
              <div className="font-medium">
                {renderNumber(row.original.request_count)}
              </div>
            </div>
          </div>
        )
      },
      {
        accessorKey: 'role',
        header: () => (
          <div className="text-center">{t.userPage.columns.role}</div>
        ),
        cell: ({ row }) => {
          const role = row.getValue<number>('role');
          return (
            <div className="text-center">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                  ROLE_STYLE[role] ?? 'bg-muted text-muted-foreground'
                )}
              >
                {renderRole(role)}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: () => (
          <div className="text-center">{t.userPage.columns.status}</div>
        ),
        cell: ({ row }) => {
          const status = row.getValue<number>('status');
          const isActive = status === 1;
          const isDisabled = status === 2;
          return (
            <div className="flex items-center justify-center gap-1.5 text-xs">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isActive && 'bg-emerald-500',
                  isDisabled && 'bg-rose-500',
                  !isActive && !isDisabled && 'bg-muted-foreground/40'
                )}
              />
              <span
                className={cn(
                  isActive && 'text-emerald-700 dark:text-emerald-400',
                  isDisabled && 'text-rose-700 dark:text-rose-400'
                )}
              >
                {isActive
                  ? t.userPage.status.activated
                  : isDisabled
                  ? t.userPage.status.disabled
                  : t.userPage.status.unknown}
              </span>
            </div>
          );
        }
      },
      {
        id: 'actions',
        header: () => (
          <div className="text-center">{t.userPage.columns.actions}</div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <CellAction data={row.original} />
          </div>
        )
      }
    ],
    [t]
  );
};
