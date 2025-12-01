'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSingleSelectFilter } from '@/components/ui/table/data-table-single-select-filter';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { createColumns, ChannelType } from './columns';
import { Channel } from '@/lib/types/channel';
import { useChannelData } from '../hooks/use-channel-data';
import { useTableFilters, STATUS_OPTIONS } from './use-table-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Trash,
  Ban,
  CircleSlash2,
  Edit,
  MoreHorizontal,
  Lightbulb,
  ListTree,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';
import MultiKeyManagementModal from '../multi-key-modal';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ModelsModal } from './models-modal';

interface OptimizedChannelTableProps {
  initialData?: Channel[];
  initialTotal?: number;
}

// 定义 Card View 组件，用于移动端展示
const MobileChannelCard = memo(
  ({
    channel,
    channelTypes,
    onManageKeys,
    onDataChange,
    onDelete
  }: {
    channel: Channel;
    channelTypes: ChannelType[];
    onManageKeys: (channel: Channel) => void;
    onDataChange: () => void;
    onDelete: (channel: Channel) => void;
  }) => {
    const router = useRouter();
    const [testLoading, setTestLoading] = useState(false);
    const [modelsModalOpen, setModelsModalOpen] = useState(false);

    // 获取状态文本和颜色
    const statusMap = {
      1: { text: '已启用', color: 'bg-green-100 text-green-800' },
      2: { text: '手动禁用', color: 'bg-gray-100 text-gray-800' },
      3: { text: '自动禁用', color: 'bg-orange-100 text-orange-800' }
    };
    const currentStatus =
      statusMap[channel.status as keyof typeof statusMap] || statusMap[2];

    // 获取类型信息
    const channelTypeInfo = useMemo(() => {
      const typeValue = channel.type;
      const channelType = channelTypes.find((t) => t.value === typeValue);
      return channelType
        ? { text: channelType.text, color: channelType.color }
        : { text: `未知类型 (${typeValue})`, color: 'gray' };
    }, [channelTypes, channel.type]);

    // 处理状态切换
    const handleStatusChange = async (newStatus: number) => {
      try {
        const res = await fetch(`/api/channel/`, {
          method: 'PUT',
          body: JSON.stringify({ id: channel.id, status: newStatus }),
          credentials: 'include'
        });
        if (res.ok) {
          toast.success('状态更新成功');
          onDataChange();
        } else {
          toast.error('状态更新失败');
        }
      } catch (error) {
        toast.error('状态更新失败');
      }
    };

    // 测试渠道
    const testChannel = async () => {
      setTestLoading(true);
      try {
        const res = await fetch(`/api/channel/test/${channel.id}`, {
          method: 'GET',
          credentials: 'include'
        });
        const { success, message, time } = await res.json();
        if (success) {
          toast.success(`测试成功，耗时 ${time.toFixed(2)} 秒`);
          onDataChange();
        } else {
          toast.error(message || '测试失败');
        }
      } finally {
        setTestLoading(false);
      }
    };

    return (
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                ID: {channel.id}
              </span>
              <div className="font-medium">{channel.name}</div>
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                {channel.multi_key_info?.is_multi_key && (
                  <DropdownMenuItem onClick={() => onManageKeys(channel)}>
                    <KeyRound className="mr-2 h-4 w-4" /> 多密钥管理
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/channel/${channel.id}`)
                  }
                >
                  <Edit className="mr-2 h-4 w-4" /> 编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(channel)}>
                  <Trash className="mr-2 h-4 w-4" /> 删除
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModelsModalOpen(true)}>
                  <ListTree className="mr-2 h-4 w-4" /> 查看模型
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">类型</span>
              <Badge variant="secondary" className="w-fit font-normal">
                {channelTypeInfo.text}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">分组</span>
              <div className="w-fit rounded bg-muted px-2 py-1 font-mono text-xs">
                {channel.group || 'default'}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">状态</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={channel.status === 1}
                  onCheckedChange={(checked) =>
                    handleStatusChange(checked ? 1 : 2)
                  }
                  className="origin-left scale-75"
                />
                <Badge
                  variant="outline"
                  className={`border-transparent ${currentStatus.color} px-1.5 py-0 text-xs`}
                >
                  {currentStatus.text}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">响应时间</span>
              <span
                className={`font-mono ${
                  !channel.response_time
                    ? 'text-gray-500'
                    : channel.response_time < 1000
                    ? 'text-green-600'
                    : channel.response_time < 3000
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {channel.response_time
                  ? `${(channel.response_time / 1000).toFixed(2)}s`
                  : '未测试'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">已用/余额</span>
              <div className="font-mono text-xs">
                <div>${(channel.used_quota / 500000).toFixed(2)}</div>
                <div className="text-muted-foreground">
                  {channel.balance !== undefined
                    ? `$${channel.balance?.toFixed(2)}`
                    : '-'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                优先级 / 权重
              </span>
              <div className="font-mono">
                {channel.priority ?? 0} / {channel.weight ?? 0}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={testChannel}
              disabled={testLoading}
            >
              <Lightbulb className="mr-2 h-3 w-3" />
              {testLoading ? '测试中...' : '测试'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={() => handleStatusChange(channel.status === 1 ? 2 : 1)}
            >
              {channel.status === 1 ? (
                <>
                  <Ban className="mr-2 h-3 w-3" /> 禁用
                </>
              ) : (
                <>
                  <CircleSlash2 className="mr-2 h-3 w-3" /> 启用
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <ModelsModal
          channel={channel}
          isOpen={modelsModalOpen}
          onClose={() => setModelsModalOpen(false)}
        />
      </Card>
    );
  }
);
MobileChannelCard.displayName = 'MobileChannelCard';

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
    const [deleteChannel, setDeleteChannel] = useState<Channel | null>(null); // 单个删除确认

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

    // 单个删除
    const handleDeleteOne = async () => {
      if (!deleteChannel) return;
      setBatchLoading(true);
      try {
        const res = await fetch(`/api/channel/${deleteChannel.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          toast.success('删除成功');
          refetch();
        } else {
          toast.error('删除失败');
        }
      } catch (error) {
        toast.error('删除失败');
      } finally {
        setOpen(false);
        setDeleteChannel(null);
        setBatchLoading(false);
      }
    };

    // 批量删除操作
    const handleDeleteBatch = async () => {
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
        <div className="space-y-4">
          {/* Mobile Skeleton */}
          <div className="space-y-4 md:hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
          {/* Desktop Skeleton */}
          <Card className="hidden md:block">
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* 添加AlertModal用于删除确认 */}
        <AlertModal
          isOpen={open}
          onClose={() => {
            setOpen(false);
            setDeleteChannel(null);
          }}
          onConfirm={deleteChannel ? handleDeleteOne : handleDeleteBatch}
          loading={batchLoading}
        />

        {/* 搜索和筛选区域 */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-1 sm:flex-row sm:items-center">
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <DataTableSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setPage={setPage}
                searchKey="ID,Name,Key"
              />
            </div>
            <DataTableSingleSelectFilter
              filterValue={statusFilter}
              setFilterValue={setStatusFilter}
              options={STATUS_OPTIONS}
              title="Status"
              filterKey="status"
            />

            {/* 批量操作按钮 - 仅在有选中项时显示 */}
            {selectedChannels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-50">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setOpen(true)}
                  disabled={batchLoading}
                  className="flex-1 sm:flex-none"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  删除 ({selectedChannels.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisable}
                  disabled={batchLoading}
                  className="flex-1 sm:flex-none"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  禁用
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnable}
                  disabled={batchLoading}
                  className="flex-1 sm:flex-none"
                >
                  <CircleSlash2 className="mr-2 h-4 w-4" />
                  启用
                </Button>
              </div>
            )}
          </div>
          <div className="self-end sm:self-auto">
            <DataTableResetFilter
              isFilterActive={isAnyFilterActive}
              onReset={resetFilters}
            />
          </div>
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

        {/* 移动端视图：卡片列表 (仅在 md 以下显示) */}
        <div className="space-y-4 md:hidden">
          {displayData.map((channel) => (
            <MobileChannelCard
              key={channel.id}
              channel={channel}
              channelTypes={channelTypes}
              onManageKeys={handleManageKeys}
              onDataChange={refetch}
              onDelete={(c) => {
                setDeleteChannel(c);
                setOpen(true);
              }}
            />
          ))}
          {/* 移动端分页控制 */}
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">
              共 {displayTotal} 条
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                上一页
              </Button>
              <span className="flex items-center px-2 text-sm">
                {page} / {Math.max(1, pageCount)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(pageCount, page + 1))}
                disabled={page >= pageCount}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>

        {/* 桌面端视图：数据表格 (仅在 md 及以上显示) */}
        <div className="hidden md:block">
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
            minWidth="1500px" // 在小屏上保证最小宽度，允许横向滚动
          />
        </div>

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
