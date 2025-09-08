'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Employee } from '@/constants/data';
import { columns } from '../employee-tables/columns';
import {
  GENDER_OPTIONS,
  useEmployeeTableFilters
} from './use-employee-table-filters';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

export default function EmployeeTable({
  data,
  totalData
}: {
  data: Employee[];
  totalData: number;
}) {
  const {
    genderFilter,
    setGenderFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery
  } = useEmployeeTableFilters();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    enableRowSelection: true
  });

  return (
    <div className="space-y-4 ">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="gender"
          title="Gender"
          options={GENDER_OPTIONS}
          setFilterValue={setGenderFilter}
          filterValue={genderFilter as string}
        />
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <DataTable
        table={table}
        columns={columns}
        data={data}
        totalItems={totalData}
      />
    </div>
  );
}
