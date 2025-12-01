'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { UserSelf } from '@/lib/types/user';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, BarChart3 } from 'lucide-react';
import { renderQuota, renderNumber } from '@/utils/render';
import { CellAction } from './cell-action';

// 移动端用户卡片
const MobileUserCard = ({ row }: { row: UserSelf }) => {
  const user = row;

  const renderStatus = (status: number | undefined) => {
    switch (status) {
      case 1:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case 2:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Disabled
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderRole = (role: number | undefined) => {
    switch (role) {
      case 1:
        return 'User';
      case 10:
        return 'Admin';
      case 100:
        return 'Root';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="mb-4 overflow-hidden text-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-xs text-muted-foreground">
                {user.email || 'No email'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderStatus(user.status)}
            <div className="md:hidden">
              <CellAction data={user} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" /> Role
            </div>
            <div className="font-medium">{renderRole(user.role)}</div>
          </div>
          <div className="space-y-1 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> Group
            </div>
            <div className="font-medium">{user.group}</div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
            <BarChart3 className="h-3 w-3" /> Statistics
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground">Balance</span>
              <span className="font-mono text-sm font-medium text-blue-600">
                {renderQuota(user.quota)}
              </span>
            </div>
            <div className="flex flex-col items-center border-l border-r px-2">
              <span className="text-[10px] text-muted-foreground">Used</span>
              <span className="font-mono text-sm font-medium">
                {renderQuota(user.used_quota)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground">
                Requests
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
  const {
    statusFilter,
    setStatusFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    page
  } = useTableFilters();

  const pageSize = 10; // Default page size

  return (
    <div className="space-y-4 ">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="ID,Username,Email"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Status"
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
          data={data as UserSelf[]}
          totalItems={totalData}
          currentPage={page}
          setCurrentPage={setPage}
          pageSize={pageSize}
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
