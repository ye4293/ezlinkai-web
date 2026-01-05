'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Token } from '@/lib/types/token';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Calendar, Clock, Database } from 'lucide-react';
import { renderQuota } from '@/utils/render';
import dayjs from 'dayjs';
import { CellAction } from './cell-action';

// 移动端Token卡片
const MobileTokenCard = ({ row }: { row: Token }) => {
  const token = row;

  const renderStatus = (status: number | undefined) => {
    switch (status) {
      case 1:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Enabled
          </Badge>
        );
      case 2:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Disabled
          </Badge>
        );
      case 3:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Expired
          </Badge>
        );
      case 4:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Exhausted
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(token.key)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy!'));
  };

  return (
    <Card className="mb-4 overflow-hidden text-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="max-w-[200px] truncate font-medium">{token.name}</div>
          <div className="flex items-center gap-2">
            {renderStatus(token.status)}
            <div className="md:hidden">
              <CellAction data={token} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Database className="h-3 w-3" /> Used
            </div>
            <span className="font-mono font-medium">
              {renderQuota(token.used_quota || 0)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Database className="h-3 w-3" /> Limit
            </div>
            <span className="font-mono font-medium">
              {token.unlimited_quota
                ? 'Unlimited'
                : renderQuota(token.remain_quota || 0)}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>
              Created:{' '}
              {dayjs(Number(token.created_time || 0) * 1000).format(
                'YYYY-MM-DD HH:mm:ss'
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              Expired:{' '}
              {token.expired_time === -1
                ? 'Never expires'
                : dayjs(Number(token.expired_time) * 1000).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={handleCopy}
        >
          <Copy className="mr-2 h-3 w-3" /> Copy Token Key
        </Button>
      </CardContent>
    </Card>
  );
};

export default function TokenTable({
  data,
  totalData
}: {
  data: Token[];
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
    page,
    pageSize,
    setPageSize
  } = useTableFilters();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="ID,Name,Key"
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
          data.map((row, index) => <MobileTokenCard key={index} row={row} />)
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
