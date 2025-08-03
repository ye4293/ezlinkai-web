'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Channel } from '@/lib/types';
import { columns, ChannelTypesProvider } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash, Ban, CircleSlash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';

export default function ChannelTable({
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
    setSearchQuery,
    page,
    pageSize,
    setPageSize
  } = useTableFilters();
  const router = useRouter();

  const [selectedChannels, setSelectedChannels] = React.useState<Channel[]>([]);
  const [batchLoading, setBatchLoading] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [resetSelection, setResetSelection] = React.useState(false);

  // 当分页状态变化时，重新获取数据
  React.useEffect(() => {
    // 开发环境下添加调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('分页状态变化:', { page, pageSize });
    }

    // 使用更高效的刷新策略
    const refreshData = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('触发数据刷新');
      }
      router.refresh();
    };

    // 防抖机制：避免快速连续的状态变化
    const timeoutId = setTimeout(
      refreshData,
      process.env.NODE_ENV === 'development' ? 50 : 0
    );

    return () => clearTimeout(timeoutId);
  }, [page, pageSize, router]);

  // 处理页面大小变化，重置到第一页
  const handlePageSizeChange = React.useCallback(
    (newPageSize: number) => {
      // 使用 startTransition 来批量更新状态，避免多次触发useEffect
      React.startTransition(() => {
        setPageSize(newPageSize);
        setPage(1);
      });
    },
    [setPageSize, setPage]
  );

  const batchOperation = async (action: 'delete' | 'enable' | 'disable') => {
    if (selectedChannels.length === 0) {
      toast.error('请选择要操作的渠道');
      return;
    }

    setBatchLoading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const channel of selectedChannels) {
        try {
          let res;
          const channelData = channel as any;

          switch (action) {
            case 'delete':
              res = await fetch(`/api/channel/${channelData.id}`, {
                method: 'DELETE',
                credentials: 'include'
              });
              break;
            case 'enable':
              res = await fetch(`/api/channel/`, {
                method: 'PUT',
                body: JSON.stringify({ id: channelData.id, status: 1 }),
                credentials: 'include'
              });
              break;
            case 'disable':
              res = await fetch(`/api/channel/`, {
                method: 'PUT',
                body: JSON.stringify({ id: channelData.id, status: 2 }),
                credentials: 'include'
              });
              break;
          }

          if (res?.ok) {
            const result = await res.json();
            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      const actionText =
        action === 'delete' ? '删除' : action === 'enable' ? '启用' : '禁用';
      if (failCount === 0) {
        toast.success(`批量${actionText}成功：${successCount} 个渠道`);
      } else if (successCount === 0) {
        toast.error(`批量${actionText}失败：${failCount} 个渠道`);
      } else {
        toast.warning(
          `批量${actionText}完成：成功 ${successCount} 个，失败 ${failCount} 个`
        );
      }

      setSelectedChannels([]);
      // 触发DataTable重置选中状态
      setResetSelection(true);
      setTimeout(() => setResetSelection(false), 100); // 短暂触发后重置
      router.refresh();
    } finally {
      setBatchLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const handleBatchDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmBatchDelete = () => {
    batchOperation('delete');
  };

  return (
    <div className="space-y-4 ">
      <AlertModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmBatchDelete}
        loading={batchLoading}
      />
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
        <div className="flex items-center gap-2">
          {selectedChannels.length > 0 && (
            <span className="mr-2 text-sm text-muted-foreground">
              已选择 {selectedChannels.length} 个渠道
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchDelete}
            disabled={batchLoading || selectedChannels.length === 0}
            className="text-destructive hover:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            批量删除
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => batchOperation('enable')}
            disabled={batchLoading || selectedChannels.length === 0}
            className="text-green-600 hover:text-green-600"
          >
            <CircleSlash2 className="mr-2 h-4 w-4" />
            批量启用
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => batchOperation('disable')}
            disabled={batchLoading || selectedChannels.length === 0}
            className="text-orange-600 hover:text-orange-600"
          >
            <Ban className="mr-2 h-4 w-4" />
            批量禁用
          </Button>
        </div>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <ChannelTypesProvider>
        <DataTable
          columns={columns()}
          data={data}
          totalItems={totalData}
          onSelectionChange={setSelectedChannels}
          resetSelection={resetSelection}
          currentPage={page}
          pageSize={pageSize}
          setCurrentPage={setPage}
          setPageSize={handlePageSizeChange}
          pageSizeOptions={[10, 50, 100, 500]}
        />
      </ChannelTypesProvider>
    </div>
  );
}
