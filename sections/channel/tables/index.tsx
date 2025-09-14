'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Channel } from '@/lib/types/channel';
import { createColumns, ChannelType } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, Ban, CircleSlash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';
import MultiKeyManagementModal from '../multi-key-modal';
import { useSession } from 'next-auth/react';

export default function ChannelTable({
  data,
  totalData
}: {
  data: Channel[];
  totalData: number;
}) {
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchChannelTypes = async () => {
        try {
          const response = await fetch('/api/channel/types');
          if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
          }
          const result = await response.json();
          if (result.object === 'list' && Array.isArray(result.data)) {
            setChannelTypes(result.data);
          } else {
            throw new Error('API 返回的数据格式不正确');
          }
        } catch (error) {
          console.error('获取渠道类型失败:', error);
          setChannelTypes([]);
        }
      };
      fetchChannelTypes();
    }
  }, [status]);

  const {
    page,
    pageSize, // 修复: perPage -> pageSize
    searchQuery, // 修复: searchTerm -> searchQuery
    statusFilter,
    setPage,
    setPageSize, // 修复: setPerPage -> setPageSize
    setSearchQuery, // 修复: setSearchTerm -> setSearchQuery
    setStatusFilter,
    resetFilters,
    isAnyFilterActive // 用于重置过滤器
  } = useTableFilters();
  const [resetSelection, setResetSelection] = useState(false);

  const [isMultiKeyModalOpen, setIsMultiKeyModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const handleOpenMultiKeyModal = (channel: Channel) => {
    setSelectedChannel(channel);
    setIsMultiKeyModalOpen(true);
  };

  const handleCloseMultiKeyModal = () => {
    setIsMultiKeyModalOpen(false);
    setSelectedChannel(null);
  };

  const handleDelete = async () => {
    setLoading(true);
    const ids = selectedChannels.map((channel) => channel.id);
    try {
      const res = await fetch('/api/channel', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        toast.success('删除成功');
        setResetSelection((prev) => !prev);
        router.refresh();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || '删除失败');
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setOpen(false);
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    const ids = selectedChannels.map((channel) => channel.id);
    try {
      const res = await fetch('/api/channel/disabled', {
        method: 'POST',
        body: JSON.stringify({ ids }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        toast.success('禁用成功');
        setResetSelection((prev) => !prev);
        router.refresh();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || '禁用失败');
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    const ids = selectedChannels.map((channel) => channel.id);
    try {
      const res = await fetch('/api/channel/disabled', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        toast.success('启用成功');
        setResetSelection((prev) => !prev);
        router.refresh();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || '启用失败');
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
      {selectedChannel && (
        <MultiKeyManagementModal
          open={isMultiKeyModalOpen}
          onOpenChange={setIsMultiKeyModalOpen}
          channel={selectedChannel}
        />
      )}

      {/* 超明显居中加载指示器 */}
      {loading && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center">
          {/* 半透明背景 */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          {/* 加载提示 */}
          <div className="relative duration-300 animate-in zoom-in-50">
            <div className="inline-flex items-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-2xl ring-4 ring-white ring-opacity-50">
              <svg
                className="-ml-1 mr-4 h-8 w-8 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-xl">正在处理...</span>
              <div className="ml-4 flex space-x-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-white"></div>
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-white"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-white"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <DataTableSearch
            searchQuery={searchQuery} // 修复: value -> searchQuery
            setSearchQuery={setSearchQuery} // 修复: onChange -> setSearchQuery
            setPage={setPage}
            searchKey="ID,Name,Key"
          />
          <DataTableFilterBox
            filterValue={statusFilter} // 修复: value -> filterValue
            setFilterValue={setStatusFilter} // 修复: onChange -> setFilterValue
            options={STATUS_OPTIONS}
            title="Status"
            filterKey="status"
          />
        </div>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive} // 修复: isFiltered -> isFilterActive
          onReset={resetFilters}
        />
      </div>
      <div className="mb-4">
        {selectedChannels.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={loading}
            >
              <Trash className="mr-2 h-4 w-4" />
              删除 ({selectedChannels.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable}
              disabled={loading}
            >
              <Ban className="mr-2 h-4 w-4" />
              禁用 ({selectedChannels.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnable}
              disabled={loading}
            >
              <CircleSlash2 className="mr-2 h-4 w-4" />
              启用 ({selectedChannels.length})
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={createColumns({
          onManageKeys: handleOpenMultiKeyModal,
          onDataChange: () => router.refresh(), // 添加数据刷新回调
          channelTypes: channelTypes
        })}
        data={data}
        totalItems={totalData}
        onSelectionChange={setSelectedChannels}
        resetSelection={resetSelection}
        currentPage={page}
        pageSize={pageSize}
        setCurrentPage={setPage} // 修复: onPageChange -> setCurrentPage
        setPageSize={setPageSize} // 修复: onPageSizeChange -> setPageSize
        pageSizeOptions={[10, 50, 100, 500]}
      />
    </>
  );
}
