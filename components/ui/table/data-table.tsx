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
  ExpandedState,
  getCoreRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  useReactTable,
  flexRender,
  RowSelectionState,
  VisibilityState,
  Row
} from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
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
  minWidth?: string; // 添加 minWidth 属性
  // 展开行功能
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
  expandAllByDefault?: boolean;
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
  initialColumnVisibility,
  minWidth = '100%', // 默认为 100%
  renderExpandedRow,
  expandAllByDefault = false
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility || {}
  );
  const [expanded, setExpanded] = useState<ExpandedState>(
    expandAllByDefault ? true : {}
  );

  // 是否启用展开功能
  const enableExpanding = !!renderExpandedRow;

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
        columnVisibility,
        ...(enableExpanding ? { expanded } : {})
      },
      pageCount,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      ...(enableExpanding
        ? { getExpandedRowModel: getExpandedRowModel() }
        : {}),
      onRowSelectionChange: setRowSelection,
      onColumnVisibilityChange: setColumnVisibility,
      ...(enableExpanding ? { onExpandedChange: setExpanded } : {}),
      enableRowSelection: true,
      enableHiding: true,
      manualPagination: true,
      ...(enableExpanding ? { getRowCanExpand: () => true } : {})
    }),
    [
      data,
      columns,
      pagination,
      rowSelection,
      columnVisibility,
      pageCount,
      enableExpanding,
      expanded
    ]
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
            💡 左右滑动查看更多列
          </div>
          <DataTableViewOptions table={table} />
        </div>
      )}
      <div
        className="mobile-table-container w-full overflow-auto rounded-md border shadow-sm"
        style={{
          maxHeight: 'calc(100vh - 320px)',
          minHeight: '200px',
          touchAction: 'pan-x pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <Table
          className="relative w-full"
          style={{
            tableLayout: 'auto', // 改为 auto，让列宽自适应内容
            minWidth:
              minWidth === '100%' && columns.length > 5 ? '1200px' : minWidth // 如果列多，给一个最小宽度
          }}
        >
          <TableHeader className="sticky top-0 z-10 bg-secondary/90 backdrop-blur supports-[backdrop-filter]:bg-secondary/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
                {/* 展开按钮列头 */}
                {enableExpanding && <TableHead className="w-[40px] px-2" />}
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3 font-semibold text-foreground"
                    style={{
                      width:
                        header.getSize() === 150 ? 'auto' : header.getSize() // 让默认大小自适应
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
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={`touch-manipulation border-b border-border/50 last:border-0 hover:bg-muted/50 ${
                      enableExpanding ? 'cursor-pointer' : ''
                    }`}
                    onClick={
                      enableExpanding ? () => row.toggleExpanded() : undefined
                    }
                  >
                    {/* 展开/折叠按钮 */}
                    {enableExpanding && (
                      <TableCell className="w-[40px] px-2 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            row.toggleExpanded();
                          }}
                        >
                          {row.getIsExpanded() ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-3"
                        style={{
                          maxWidth: '300px', // 限制单元格最大宽度，防止内容过长撑开太宽
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* 展开的详情行 */}
                  {enableExpanding &&
                    row.getIsExpanded() &&
                    renderExpandedRow && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={columns.length + 1} className="p-0">
                          {renderExpandedRow(row)}
                        </TableCell>
                      </TableRow>
                    )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableExpanding ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              Rows
            </p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                const newPageSize = Number(value);
                setPageSize(newPageSize);
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
          <div className="text-xs text-muted-foreground sm:text-sm">
            {data.length > 0 ? (
              <span>
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalItems || data.length)} of{' '}
                {totalItems || data.length}
              </span>
            ) : (
              '0 of 0'
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground sm:hidden">
            Page {currentPage}/{pageCount || 1}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={useCallback(() => {
                setCurrentPage(1);
              }, [setCurrentPage])}
              disabled={currentPage <= 1}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={useCallback(() => {
                setCurrentPage(Math.max(1, currentPage - 1));
              }, [setCurrentPage, currentPage])}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="hidden text-xs font-medium sm:block sm:px-2">
              Page {currentPage} of {pageCount || 1}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={useCallback(() => {
                setCurrentPage(Math.min(pageCount, currentPage + 1));
              }, [setCurrentPage, currentPage, pageCount])}
              disabled={currentPage >= pageCount}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={useCallback(() => {
                setCurrentPage(pageCount);
              }, [setCurrentPage, pageCount])}
              disabled={currentPage >= pageCount}
            >
              <DoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
