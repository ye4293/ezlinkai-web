'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { createColumns, ChannelType } from './columns';
import { Channel } from '@/lib/types/channel';
import { useChannelData } from '../hooks/use-channel-data';
import { useTableFilters } from './use-table-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
      resetFilters,
      isAnyFilterActive
    } = useTableFilters();

    // 渠道类型数据
    const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
    const { status } = useSession();

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
        {/* 过滤器重置按钮 */}
        {isAnyFilterActive && (
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              清除筛选条件
            </button>
          </div>
        )}

        {/* 超明显居中加载指示器 */}
        {loading && displayData.length > 0 && (
          <div
            className="pointer-events-none fixed inset-0 flex items-center justify-center"
            style={{
              zIndex: 99999,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            {/* 半透明背景 */}
            <div
              className="absolute inset-0 bg-black bg-opacity-30"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            ></div>
            {/* 加载提示 */}
            <div
              className="relative duration-300 animate-in zoom-in-50"
              style={{
                position: 'relative',
                zIndex: 100000
              }}
            >
              <div
                className="inline-flex items-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-2xl ring-4 ring-white ring-opacity-50"
                style={{
                  background: 'linear-gradient(to right, #2563eb, #9333ea)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '4px solid rgba(255, 255, 255, 0.5)'
                }}
              >
                <svg
                  className="-ml-1 mr-4 h-8 w-8 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  style={{ width: '32px', height: '32px', marginRight: '16px' }}
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
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  正在更新数据...
                </span>
                <div
                  className="ml-4 flex space-x-2"
                  style={{ marginLeft: '16px' }}
                >
                  <div
                    className="h-3 w-3 animate-bounce rounded-full bg-white"
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'white',
                      borderRadius: '50%'
                    }}
                  ></div>
                  <div
                    className="h-3 w-3 animate-bounce rounded-full bg-white"
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animationDelay: '0.1s'
                    }}
                  ></div>
                  <div
                    className="h-3 w-3 animate-bounce rounded-full bg-white"
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animationDelay: '0.2s'
                    }}
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
          currentPage={page}
          pageSize={pageSize}
          setCurrentPage={setPage}
          setPageSize={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
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
