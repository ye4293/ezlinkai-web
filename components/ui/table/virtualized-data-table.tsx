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
  RowSelectionState
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
// 注意：需要安装 react-window 包
// npm install react-window @types/react-window
// 暂时注释掉虚拟化功能，避免构建错误
// import { FixedSizeList } from 'react-window';

interface VirtualizedDataTableProps<TData, TValue> {
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
  rowHeight?: number; // 行高，用于虚拟化
  containerHeight?: number; // 容器高度
}

export function VirtualizedDataTable<TData, TValue>({
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
  rowHeight = 52,
  containerHeight = 400
}: VirtualizedDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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
        rowSelection
      },
      pageCount,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onRowSelectionChange: setRowSelection,
      enableRowSelection: true,
      manualPagination: true
    }),
    [data, columns, pagination, rowSelection, pageCount]
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

  // 虚拟化行渲染组件 - 暂时禁用
  // const VirtualRow = useCallback(
  //   ({ index, style }: { index: number; style: any }) => {
  //     const row = table.getRowModel().rows[index];
  //     if (!row) return null;

  //     return (
  //       <div style={style}>
  //         <TableRow
  //           key={row.id}
  //           data-state={row.getIsSelected() && 'selected'}
  //           className="border-b"
  //         >
  //           {row.getVisibleCells().map((cell) => (
  //             <TableCell key={cell.id} className="p-2">
  //               {flexRender(cell.column.columnDef.cell, cell.getContext())}
  //             </TableCell>
  //           ))}
  //         </TableRow>
  //       </div>
  //     );
  //   },
  //   [table]
  // );

  return (
    <div className="space-y-4">
      <ScrollArea className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="p-2">
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
        </Table>

        {/* 虚拟化表格主体 - 暂时使用普通渲染 */}
        <div style={{ height: containerHeight, overflow: 'auto' }}>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id} style={{ height: rowHeight }}>
                <TableRow
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-b"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </div>
            ))
          ) : (
            <div className="flex h-24 items-center justify-center">
              <span>No results.</span>
            </div>
          )}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="relative z-10 flex items-center justify-between space-x-6 px-2 py-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {data.length > 0 ? (
                <>
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{' '}
                  entries
                </>
              ) : (
                'No entries found'
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {data.length > 0 ? (
                <>
                  Page {currentPage} of {pageCount}
                </>
              ) : (
                'No pages'
              )}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 p-0"
              onClick={useCallback(() => {
                setCurrentPage(1);
              }, [setCurrentPage])}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Go to first page</span>
              <DoubleArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 p-0"
              onClick={useCallback(() => {
                setCurrentPage(Math.max(1, currentPage - 1));
              }, [setCurrentPage, currentPage])}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 p-0"
              onClick={useCallback(() => {
                setCurrentPage(Math.min(pageCount, currentPage + 1));
              }, [setCurrentPage, currentPage, pageCount])}
              disabled={currentPage >= pageCount}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="relative z-20 h-8 w-8 p-0"
              onClick={useCallback(() => {
                setCurrentPage(pageCount);
              }, [setCurrentPage, pageCount])}
              disabled={currentPage >= pageCount}
            >
              <span className="sr-only">Go to last page</span>
              <DoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
