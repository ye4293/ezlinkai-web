import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import {
  ColumnDef,
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
  RowSelectionState
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems: number;
  onSelectionChange?: (selectedRows: TData[]) => void;
  resetSelection?: boolean;
  currentPage?: number;
  pageSize?: number;
  setCurrentPage?: (page: number) => void;
  setPageSize?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalItems,
  onSelectionChange,
  resetSelection,
  currentPage: externalCurrentPage,
  pageSize: externalPageSize,
  setCurrentPage: externalSetCurrentPage,
  setPageSize: externalSetPageSize,
  pageSizeOptions = [10, 50, 100, 500]
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 内部分页状态（用于向下兼容）
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(10);

  // 使用外部状态或内部状态
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const pageSize = externalPageSize ?? internalPageSize;
  const setCurrentPage = externalSetCurrentPage ?? setInternalCurrentPage;
  const setPageSize = externalSetPageSize ?? setInternalPageSize;

  // 使用实际数据长度计算页数，而不是totalItems
  const pageCount = Math.ceil(data.length / pageSize);
  const pagination: PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize
  };

  // 监听数据变化，当数据长度变化时重置选中状态
  const [prevDataLength, setPrevDataLength] = useState(data.length);
  useEffect(() => {
    if (data.length !== prevDataLength) {
      setRowSelection({});
      setPrevDataLength(data.length);
    }
  }, [data.length, prevDataLength]);

  // 监听resetSelection属性，当父组件要求重置时清除选中状态
  useEffect(() => {
    if (resetSelection) {
      setRowSelection({});
    }
  }, [resetSelection]);

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      rowSelection
    },
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    manualPagination: true
  });

  useEffect(() => {
    if (onSelectionChange) {
      const selectedRowsData = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedRowsData);
    }
  }, [rowSelection, onSelectionChange, table]);

  return (
    <div className="w-full space-y-4">
      <ScrollArea className="h-[calc(80vh-220px)] rounded-md border">
        <Table className="relative">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                    <TableCell key={cell.id}>
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

      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-4 sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            {data.length > 0 ? (
              <>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, data.length)} of {data.length}{' '}
                entries
              </>
            ) : (
              'No entries found'
            )}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-sm font-medium">
                Rows per page
              </p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  const newPageSize = Number(value);
                  setPageSize(newPageSize);
                  // 如果有外部的setCurrentPage，也重置页面到第一页
                  if (externalSetCurrentPage) {
                    externalSetCurrentPage(1);
                  } else {
                    setInternalCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={`${option}`}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
          <div className="flex w-[150px] items-center justify-center text-sm font-medium">
            {data.length > 0 ? (
              <>
                Page {currentPage} of {pageCount}
              </>
            ) : (
              'No pages'
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() =>
                setCurrentPage(Math.min(pageCount, currentPage + 1))
              }
              disabled={currentPage >= pageCount}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(pageCount)}
              disabled={currentPage >= pageCount}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
