'use client';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { DataTableSingleFilterBox } from '@/components/ui/table/data-table-single-filter-box';
import { CHANNEL_OPTIONS } from '@/constants';
import { useToggle } from '@/hooks/use-toggle';
import { Channel } from '@/lib/types';
import React, { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import { ChannelTypesProvider } from '../channel-types-provider';
import MultiKeyModal from '../multi-key-modal';
import { columns } from './columns';
import { useTableFilters } from './use-table-filters';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import {
  getCoreRowModel,
  useReactTable,
  VisibilityState
} from '@tanstack/react-table';

const columnDisplayNames: { [key: string]: string } = {
  select: 'Select',
  id: 'ID',
  name: 'Name',
  type: 'Type',
  group: 'Group',
  status: 'Status',
  response_time: 'Response Time',
  balance: 'Balance',
  priority: 'Priority',
  actions: 'Actions'
};

export default function ChannelTable({
  data,
  totalData
}: {
  data: Channel[];
  totalData: number;
}) {
  const [selectedRows, setSelectedRows] = React.useState<Channel[]>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const {
    name,
    setName,
    type,
    setType,
    isAnyFilterActive,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize
  } = useTableFilters();

  const multiKeyModal = useToggle();
  const [selectedChannelId, setSelectedChannelId] = React.useState<
    number | undefined
  >();

  const handleOpenMultiKeyModal = (channelId: number) => {
    setSelectedChannelId(channelId);
    multiKeyModal.onOpen();
  };

  const table = useReactTable({
    data,
    columns: columns({ onManageKeys: handleOpenMultiKeyModal }),
    state: {
      columnVisibility
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    enableRowSelection: true
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <DataTableSearch
            searchKey="Name"
            searchQuery={name}
            setSearchQuery={setName}
            setPage={setPage}
          />
          <DataTableSingleFilterBox
            filterKey="type"
            title="Type"
            options={CHANNEL_OPTIONS}
            setFilterValue={setType}
            filterValue={type}
          />
          <DataTableResetFilter
            isFilterActive={isAnyFilterActive}
            onReset={() => {
              resetFilters();
              setPage(1);
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <MixerHorizontalIcon className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnDisplayNames[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ChannelTypesProvider>
          <DataTable
            table={table}
            columns={columns({ onManageKeys: handleOpenMultiKeyModal })}
            data={data}
            totalItems={totalData}
            onSelectionChange={setSelectedRows}
            resetSelection={!data.length}
            currentPage={page}
            pageSize={pageSize}
            setCurrentPage={setPage}
            setPageSize={setPageSize}
            pageSizeOptions={[10, 50, 100, 500]}
          />
        </ChannelTypesProvider>
      </div>
      <MultiKeyModal
        channelId={selectedChannelId}
        isOpen={multiKeyModal.isOpen}
        onClose={multiKeyModal.onClose}
      />
    </>
  );
}
