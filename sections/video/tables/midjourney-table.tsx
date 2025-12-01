'use client';
import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoStat } from '@/lib/types/video';
import dayjs from 'dayjs';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string;
  pageNo: number;
  totalUsers: number;
  pageSizeOptions?: number[];
  pageCount: number;
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

// 移动端视频/Midjourney卡片
const MobileVideoCard = ({ row }: { row: any }) => {
  const item = row.original as VideoStat;

  const getStatusColor = (status: string) => {
    if (status === 'success') return 'bg-green-100 text-green-800';
    if (status === 'failed') return 'bg-red-100 text-red-800';
    if (status === 'running') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="mb-4 overflow-hidden text-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="text-xs text-muted-foreground">
            {dayjs(Number(item.created_at || 0) * 1000).format(
              'YYYY-MM-DD HH:mm:ss'
            )}
          </div>
          <Badge
            variant="outline"
            className={getStatusColor(item.status || '')}
          >
            {item.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">User</span>
            <span className="truncate font-medium">{item.username}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Task ID</span>
            <span className="truncate font-mono text-xs" title={item.task_id}>
              {(item.task_id || '').substring(0, 10)}...
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Model</span>
          <span className="break-all font-medium">{item.model}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded bg-muted/30 p-2">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Channel</span>
            <span className="font-mono">{item.channel_id}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Duration</span>
            <span className="font-mono">{item.duration}s</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Quota</span>
            <span className="font-mono text-blue-600">
              ${((item.quota || 0) / 500000).toFixed(6)}
            </span>
          </div>
        </div>

        {item.store_url && (
          <div className="pt-1">
            <a
              href={item.store_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline"
            >
              View Generated Content
            </a>
          </div>
        )}

        {item.fail_reason && (
          <div className="break-all border-t pt-2 text-xs text-red-600">
            Error: {item.fail_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function MidjourneyTable<TData, TValue>({
  columns,
  data,
  pageNo,
  searchKey,
  totalUsers,
  pageCount,
  pageSizeOptions = [10, 20, 30, 40, 50]
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Search params
  const page = searchParams?.get('page') ?? '1';
  const pageAsNumber = Number(page);
  const fallbackPage =
    isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;
  const per_page = searchParams?.get('limit') ?? '10';
  const perPageAsNumber = Number(per_page);
  const fallbackPerPage = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;

  /* this can be used to get the selectedrows 
  console.log("value", table.getFilteredSelectedRowModel()); */

  // Create query string
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: fallbackPage - 1,
      pageSize: fallbackPerPage
    });

  React.useEffect(() => {
    router.push(
      `${pathname}?${createQueryString({
        page: pageIndex + 1,
        limit: pageSize
      })}`,
      {
        scroll: false
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: { pageIndex, pageSize }
    },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true
  });

  const searchValue = table.getColumn(searchKey)?.getFilterValue() as string;

  React.useEffect(() => {
    if (searchValue?.length > 0) {
      router.push(
        `${pathname}?${createQueryString({
          page: null,
          limit: null,
          search: searchValue
        })}`,
        {
          scroll: false
        }
      );
    }
    if (searchValue?.length === 0 || searchValue === undefined) {
      router.push(
        `${pathname}?${createQueryString({
          page: null,
          limit: null,
          search: null
        })}`,
        {
          scroll: false
        }
      );
    }

    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <>
      <Input
        placeholder={`Search ${searchKey}...`}
        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
        onChange={(event) =>
          table.getColumn(searchKey)?.setFilterValue(event.target.value)
        }
        className="mb-4 w-full md:max-w-sm"
      />

      {/* Desktop View */}
      <div className="hidden md:block">
        <ScrollArea className="h-[calc(80vh-220px)] rounded-md border">
          <Table className="relative" style={{ minWidth: '1000px' }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map((row) => <MobileVideoCard key={row.id} row={row} />)
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            No results.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} rows
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground sm:hidden">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setPagination({ pageIndex: 0, pageSize });
              }}
              disabled={pageIndex <= 0}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setPagination({
                  pageIndex: Math.max(0, pageIndex - 1),
                  pageSize
                });
              }}
              disabled={pageIndex <= 0}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="hidden text-sm font-medium sm:block sm:px-2">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setPagination({ pageIndex: pageIndex + 1, pageSize });
              }}
              disabled={!pageCount || pageIndex >= pageCount - 1}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (pageCount) {
                  setPagination({ pageIndex: pageCount - 1, pageSize });
                }
              }}
              disabled={!pageCount || pageIndex >= pageCount - 1}
            >
              <DoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
