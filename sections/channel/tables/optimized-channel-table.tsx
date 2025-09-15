'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { createColumns, ChannelType } from './columns';
import { Channel } from '@/lib/types/channel';
import { useChannelData } from '../hooks/use-channel-data';
import { useTableFilters, STATUS_OPTIONS } from './use-table-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trash, Ban, CircleSlash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';
import MultiKeyManagementModal from '../multi-key-modal';
import { useSession } from 'next-auth/react';

interface OptimizedChannelTableProps {
  initialData?: Channel[];
  initialTotal?: number;
}

const OptimizedChannelTable = memo(
  ({ initialData = [], initialTotal = 0 }: OptimizedChannelTableProps) => {
    const {
      searchQuery,
      statusFilter,
      page,
      pageSize,
      setPage,
      setPageSize,
      setSearchQuery,
      setStatusFilter,
      resetFilters,
      isAnyFilterActive
    } = useTableFilters();

    // 路由和session
    const router = useRouter();
    const { status } = useSession();

    // 渠道类型数据
    const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);

    // 批量操作状态
    const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
    const [resetSelection, setResetSelection] = useState(false);
    const [open, setOpen] = useState(false);
    const [batchLoading, setBatchLoading] = useState(false);

    // 多密钥管理Modal状态
    const [isMultiKeyModalOpen, setIsMultiKeyModalOpen] = useState(false);
    const [selectedChannelForModal, setSelectedChannelForModal] =
      useState<Channel | null>(null);

    // 获取渠道类型数据
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
      data: channels,
      total,
      loading,
      error,
      refetch
    } = useChannelData({
      page,
      pageSize,
      keyword: searchQuery,
      status: statusFilter
    });

    // 使用初始数据作为后备，避免首次加载闪烁
    const displayData = useMemo(() => {
      if (loading && channels.length === 0) {
        return initialData;
      }
      return channels;
    }, [channels, initialData, loading]);

    const displayTotal = useMemo(() => {
      if (loading && total === 0) {
        return initialTotal;
      }
      return total;
    }, [total, initialTotal, loading]);

    // 计算页面数量
    const pageCount = Math.ceil(displayTotal / pageSize);

    // 管理密钥的回调函数
    const handleManageKeys = useCallback((channel: Channel) => {
      setSelectedChannelForModal(channel);
      setIsMultiKeyModalOpen(true);
    }, []);

    // 批量删除操作
    const handleDelete = async () => {
      setBatchLoading(true);
      const ids = selectedChannels.map((channel) => channel.id);
      try {
        const res = await fetch('/api/channel/batchdelete', {
          method: 'POST',
          body: JSON.stringify({ ids }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          toast.success('删除成功');
          setResetSelection((prev) => !prev);
          refetch(); // 使用 refetch 而不是 router.refresh
        } else {
          // 改进错误处理：检查响应是否为JSON格式
          let errorMessage = '删除失败';
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || `删除失败 (HTTP ${res.status})`;
          } catch (jsonError) {
            // 如果响应不是JSON格式，使用HTTP状态码信息
            errorMessage = `删除失败 (HTTP ${res.status}: ${res.statusText})`;
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('批量删除错误:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error(errorMsg);
      } finally {
        setOpen(false);
        setBatchLoading(false);
      }
    };

    // 批量禁用操作
    const handleDisable = async () => {
      setBatchLoading(true);
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
          refetch(); // 使用 refetch 而不是 router.refresh
        } else {
          // 改进错误处理：检查响应是否为JSON格式
          let errorMessage = '禁用失败';
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || `禁用失败 (HTTP ${res.status})`;
          } catch (jsonError) {
            // 如果响应不是JSON格式，使用HTTP状态码信息
            errorMessage = `禁用失败 (HTTP ${res.status}: ${res.statusText})`;
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('批量禁用错误:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error(errorMsg);
      } finally {
        setBatchLoading(false);
      }
    };

    // 批量启用操作
    const handleEnable = async () => {
      setBatchLoading(true);
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
          refetch(); // 使用 refetch 而不是 router.refresh
        } else {
          // 改进错误处理：检查响应是否为JSON格式
          let errorMessage = '启用失败';
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || `启用失败 (HTTP ${res.status})`;
          } catch (jsonError) {
            // 如果响应不是JSON格式，使用HTTP状态码信息
            errorMessage = `启用失败 (HTTP ${res.status}: ${res.statusText})`;
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('批量启用错误:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error(errorMsg);
      } finally {
        setBatchLoading(false);
      }
    };

    // 生成列配置
    const tableColumns = useMemo(() => {
      return createColumns({
        onManageKeys: handleManageKeys,
        onDataChange: refetch, // 传递数据刷新函数
        channelTypes: channelTypes
      });
    }, [handleManageKeys, refetch, channelTypes]);

    // 错误处理
    if (error) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p>加载失败: {error}</p>
              <button
                onClick={refetch}
                className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                重试
              </button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 加载状态
    if (loading && displayData.length === 0) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* 添加AlertModal用于删除确认 */}
        <AlertModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={handleDelete}
          loading={batchLoading}
        />

        {/* 搜索和筛选区域 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <DataTableSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setPage={setPage}
              searchKey="ID,Name,Key"
            />
            <DataTableFilterBox
              filterValue={statusFilter}
              setFilterValue={setStatusFilter}
              options={STATUS_OPTIONS}
              title="Status"
              filterKey="status"
            />

            {/* 批量操作按钮 - 直接跟在Status后面 */}
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setOpen(true)}
                disabled={batchLoading || selectedChannels.length === 0}
              >
                <Trash className="mr-2 h-4 w-4" />
                删除
                {selectedChannels.length > 0 && ` (${selectedChannels.length})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisable}
                disabled={batchLoading || selectedChannels.length === 0}
              >
                <Ban className="mr-2 h-4 w-4" />
                禁用
                {selectedChannels.length > 0 && ` (${selectedChannels.length})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnable}
                disabled={batchLoading || selectedChannels.length === 0}
              >
                <CircleSlash2 className="mr-2 h-4 w-4" />
                启用
                {selectedChannels.length > 0 && ` (${selectedChannels.length})`}
              </Button>
            </div>
          </div>
          <DataTableResetFilter
            isFilterActive={isAnyFilterActive}
            onReset={resetFilters}
          />
        </div>

        {/* 超明显居中加载指示器 - 支持搜索和批量操作加载 */}
        {(loading || batchLoading) && (
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

        {/* 数据表格 */}
        <DataTable
          columns={tableColumns}
          data={displayData}
          totalItems={displayTotal}
          onSelectionChange={setSelectedChannels}
          resetSelection={resetSelection}
          currentPage={page}
          pageSize={pageSize}
          setCurrentPage={setPage}
          setPageSize={setPageSize}
          pageSizeOptions={[10, 50, 100, 500]}
        />

        {/* 多密钥管理Modal */}
        <MultiKeyManagementModal
          open={isMultiKeyModalOpen}
          onOpenChange={setIsMultiKeyModalOpen}
          channel={selectedChannelForModal}
        />
      </div>
    );
  }
);

OptimizedChannelTable.displayName = 'OptimizedChannelTable';

export default OptimizedChannelTable;
