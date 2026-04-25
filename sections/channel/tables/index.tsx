'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSingleSelectFilter } from '@/components/ui/table/data-table-single-select-filter';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Channel } from '@/lib/types/channel';
import { createColumns, ChannelType } from './columns';
import { STATUS_OPTIONS, useTableFilters } from './use-table-filters';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, Ban, CircleSlash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';
import MultiKeyManagementModal from '../multi-key-modal';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';

export default function ChannelTable({
  data,
  totalData
}: {
  data: Channel[];
  totalData: number;
}) {
  const { t } = useLocale();
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

      {/* 居中加载指示器 */}
      {loading && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
          <div className="relative flex items-center gap-3 rounded-lg border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-lg duration-200 animate-in fade-in zoom-in-95">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span>{t.channelPage.overlay.processing}</span>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <DataTableSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setPage={setPage}
            searchKey="ID,Name,Key"
          />
          <DataTableSingleSelectFilter
            filterValue={statusFilter}
            setFilterValue={setStatusFilter}
            options={STATUS_OPTIONS}
            title={t.channelPage.columns.status}
            filterKey="status"
          />
        </div>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
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
              {t.channelPage.bulk.delete} ({selectedChannels.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable}
              disabled={loading}
            >
              <Ban className="mr-2 h-4 w-4" />
              {t.channelPage.bulk.disable} ({selectedChannels.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnable}
              disabled={loading}
            >
              <CircleSlash2 className="mr-2 h-4 w-4" />
              {t.channelPage.bulk.enable} ({selectedChannels.length})
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={createColumns({
          onManageKeys: handleOpenMultiKeyModal,
          onDataChange: () => router.refresh(),
          channelTypes: channelTypes,
          t
        })}
        data={data}
        totalItems={totalData}
        onSelectionChange={setSelectedChannels}
        resetSelection={resetSelection}
        currentPage={page}
        pageSize={pageSize}
        setCurrentPage={setPage}
        setPageSize={setPageSize}
        pageSizeOptions={[10, 50, 100, 500]}
        minWidth="1400px"
      />
    </>
  );
}
