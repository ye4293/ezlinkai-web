'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { UserSelf } from '@/lib/types/user';
import { useUserColumns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, BarChart3 } from 'lucide-react';
import { renderQuota, renderNumber } from '@/utils/render';
import { CellAction } from './cell-action';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<number, { dot: string; text: string }> = {
  1: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400'
  },
  2: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' }
};

const ROLE_STYLE: Record<number, string> = {
  1: 'bg-muted text-foreground/80',
  10: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  100: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
};

const MobileUserCard = ({ row }: { row: UserSelf }) => {
  const { t } = useLocale();
  const user = row;

  const statusKey =
    user.status === 1
      ? 'activated'
      : user.status === 2
      ? 'disabled'
      : 'unknown';
  const statusStyle = STATUS_DOT[user.status ?? 0];

  const roleKey =
    user.role === 1
      ? 'user'
      : user.role === 10
      ? 'admin'
      : user.role === 100
      ? 'root'
      : 'unknown';

  return (
    <Card className="mb-4 overflow-hidden text-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{user.username}</div>
              <div className="truncate text-xs text-muted-foreground">
                {user.email || '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  statusStyle?.dot ?? 'bg-muted-foreground/40'
                )}
              />
              <span className={statusStyle?.text}>
                {t.userPage.status[statusKey]}
              </span>
            </span>
            <CellAction data={user} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" /> {t.userPage.columns.role}
            </div>
            <span
              className={cn(
                'inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium',
                ROLE_STYLE[user.role ?? 0] ?? 'bg-muted text-muted-foreground'
              )}
            >
              {t.userPage.role[roleKey]}
            </span>
          </div>
          <div className="space-y-1 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {t.userPage.columns.group}
            </div>
            <div className="font-medium">{user.group || '—'}</div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
            <BarChart3 className="h-3 w-3" /> {t.userPage.columns.statistics}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground">
                {t.userPage.stats.balance}
              </span>
              <span className="font-mono text-sm font-medium text-blue-600">
                {renderQuota(user.quota)}
              </span>
            </div>
            <div className="flex flex-col items-center border-l border-r px-2">
              <span className="text-[10px] text-muted-foreground">
                {t.userPage.stats.used}
              </span>
              <span className="font-mono text-sm font-medium">
                {renderQuota(user.used_quota)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground">
                {t.userPage.stats.requests}
              </span>
              <span className="font-mono text-sm font-medium">
                {renderNumber(user.request_count)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function UserTable({
  data,
  totalData
}: {
  data: UserSelf[];
  totalData: number;
}) {
  const { t } = useLocale();
  const columns = useUserColumns();
  const {
    statusFilter,
    setStatusFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    page,
    pageSize,
    setPageSize
  } = useTableFilters();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="ID,Username,Email"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title={t.userPage.columns.status}
          options={STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data}
          totalItems={totalData}
          currentPage={page}
          setCurrentPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>

      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {data.length > 0 ? (
          data.map((row, index) => <MobileUserCard key={index} row={row} />)
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            No results found.
          </div>
        )}

        {/* Mobile Pagination */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">Total {totalData}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="flex items-center px-2 text-sm">{page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={data.length < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
