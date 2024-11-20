'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
// import { Channel } from '@/constants/data';
import { Channel } from '@/lib/types';
import { columns } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';

export default function UserTable({
  data,
  totalData
}: {
  data: Channel[];
  totalData: number;
}) {
  const {
    statusFilter,
    setStatusFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    refetchData,
    setSearchQuery
  } = useTableFilters();

  const handleDataTableUpdate = () => {
    // 在这里实现您的更新逻辑
    console.log('Updating data list...');
    refetchData();
  };

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
      <DataTable
        columns={columns(handleDataTableUpdate)}
        data={data}
        totalItems={totalData}
      />
    </div>
  );
}
