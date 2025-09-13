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
  getPaginationRowModel,
  useReactTable,
  flexRender,
  RowSelectionState,
  VisibilityState
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DataTableViewOptions } from './data-table-column-toggle';

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
  showColumnToggle?: boolean;
  initialColumnVisibility?: VisibilityState;
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
  pageSizeOptions = [10, 50, 100, 500],
  showColumnToggle = false,
  initialColumnVisibility
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility || {}
  );

  // 内部分页状态（用于向下兼容）
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(10);

  // 使用外部状态或内部状态
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const pageSize = externalPageSize ?? internalPageSize;
  const setCurrentPage = externalSetCurrentPage ?? setInternalCurrentPage;
  const setPageSize = externalSetPageSize ?? setInternalPageSize;

  // 使用totalItems计算页数，支持服务端分页 - 使用useMemo优化计算
  const pageCount = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: currentPage - 1,
      pageSize: pageSize
    }),
    [currentPage, pageSize]
  );

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

  // 优化表格配置 - 使用useMemo缓存配置对象
  const tableConfig = useMemo(
    () => ({
      data,
      columns,
      state: {
        pagination,
        rowSelection,
        columnVisibility
      },
      pageCount,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onRowSelectionChange: setRowSelection,
      onColumnVisibilityChange: setColumnVisibility,
      enableRowSelection: true,
      enableHiding: true,
      manualPagination: true
    }),
    [data, columns, pagination, rowSelection, columnVisibility, pageCount]
  );

  const table = useReactTable(tableConfig);

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
      {showColumnToggle && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground sm:hidden">
            💡 左右滑动查看更多列 (表格宽度: 1500px)
          </div>
          <DataTableViewOptions table={table} />
        </div>
      )}
      <div
        className="mobile-table-container h-[calc(80vh-220px)] w-full overflow-auto rounded-md border"
        style={{
          touchAction: 'pan-x pan-y',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(203 213 225) transparent',
          overscrollBehavior: 'contain'
        }}
      >
        <Table
          className="relative w-full min-w-[1500px]"
          style={{
            tableLayout: 'fixed',
            width: '1500px'
          }}
        >
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap border-b border-border/40"
                    style={{
                      minWidth: Math.max(header.getSize() || 120, 120),
                      width: header.getSize() || 150
                    }}
                  >
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
                  className="touch-manipulation hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-2 py-2 sm:px-4"
                      style={{
                        minWidth: Math.max(cell.column.getSize() || 120, 120),
                        width: cell.column.getSize() || 150
                      }}
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
      </div>

      <div className="relative z-10 flex flex-col gap-4 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium sm:text-sm">Rows per page</p>
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
              <SelectTrigger className="h-8 w-[60px] sm:w-[70px]">
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground sm:text-sm">
              {data.length > 0 ? (
                <>
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, data.length)} of{' '}
                  {data.length} entries
                </>
              ) : (
                'No entries found'
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium sm:text-sm">
              {data.length > 0 ? (
                <>
                  Page {currentPage} of {pageCount}
                </>
              ) : (
                'No pages'
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 touch-manipulation p-0"
              onClick={useCallback(() => {
                setCurrentPage(1);
              }, [setCurrentPage])}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Go to first page</span>
              <DoubleArrowLeftIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 touch-manipulation p-0"
              onClick={useCallback(() => {
                setCurrentPage(Math.max(1, currentPage - 1));
              }, [setCurrentPage, currentPage])}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 touch-manipulation p-0"
              onClick={useCallback(() => {
                setCurrentPage(Math.min(pageCount, currentPage + 1));
              }, [setCurrentPage, currentPage, pageCount])}
              disabled={currentPage >= pageCount}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 touch-manipulation p-0"
              onClick={useCallback(() => {
                setCurrentPage(pageCount);
              }, [setCurrentPage, pageCount])}
              disabled={currentPage >= pageCount}
            >
              <span className="sr-only">Go to last page</span>
              <DoubleArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
