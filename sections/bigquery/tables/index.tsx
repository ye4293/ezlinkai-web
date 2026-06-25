'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DateTimeRangePicker } from '@/components/datetime-range-picker';
import { columns, AuditSummary } from './columns';
import { useAuditTableFilters } from './use-table-filters';
import { DetailDialog, AuditDetailData } from './detail-dialog';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ColumnDef } from '@tanstack/react-table';

export default function AuditTable() {
  const { data: session } = useSession();
  const {
    xRequestId,
    setXRequestId,
    channelId,
    setChannelId,
    actualModel,
    setActualModel,
    statusCode,
    setStatusCode,
    page,
    setPage,
    pageSize,
    setPageSize,
    resetFilters,
    isAnyFilterActive,
    dateTimeRange,
    setDateTimeRange,
    startTimestamp,
    endTimestamp
  } = useAuditTableFilters();

  const [data, setData] = useState<AuditSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<AuditDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [localXRequestId, setLocalXRequestId] = useState(xRequestId || '');
  const [localChannelId, setLocalChannelId] = useState(channelId || '');
  const [localModel, setLocalModel] = useState(actualModel || '');
  const [localStatusCode, setLocalStatusCode] = useState(statusCode || '');

  useEffect(() => setLocalXRequestId(xRequestId || ''), [xRequestId]);
  useEffect(() => setLocalChannelId(channelId || ''), [channelId]);
  useEffect(() => setLocalModel(actualModel || ''), [actualModel]);
  useEffect(() => setLocalStatusCode(statusCode || ''), [statusCode]);

  const fetchData = useCallback(async () => {
    if (!session?.user?.accessToken) return;
    if (!startTimestamp || !endTimestamp) return;
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pagesize: String(pageSize),
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp
      });
      if (xRequestId) params.set('x_request_id', xRequestId);
      if (channelId) params.set('channel_id', channelId);
      if (actualModel) params.set('actual_model', actualModel);
      if (statusCode) params.set('status_code', statusCode);

      const res = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + `/api/audit/logs?${params}`,
        {
          credentials: 'include',
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        }
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data?.list || []);
        setTotal(json.data?.total || 0);
      } else {
        console.error('Audit fetch error:', json.message);
        setData([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
    } finally {
      setIsFetching(false);
    }
  }, [
    session,
    page,
    pageSize,
    xRequestId,
    channelId,
    actualModel,
    statusCode,
    startTimestamp,
    endTimestamp
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchDetail = useCallback(
    async (xReqId: string) => {
      if (!session?.user?.accessToken || !startTimestamp || !endTimestamp)
        return;
      setDetailLoading(true);
      setDetailOpen(true);
      try {
        const params = new URLSearchParams({
          x_request_id: xReqId,
          start_timestamp: startTimestamp,
          end_timestamp: endTimestamp
        });
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL + `/api/audit/detail?${params}`,
          {
            credentials: 'include',
            headers: { Authorization: `Bearer ${session.user.accessToken}` }
          }
        );
        const json = await res.json();
        if (json.success && json.data) {
          setDetailData(json.data);
        } else {
          setDetailData(null);
        }
      } catch (error) {
        console.error('Failed to fetch audit detail:', error);
        setDetailData(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [session, startTimestamp, endTimestamp]
  );

  const handleSearch = () => {
    setPage(1);
    setXRequestId(localXRequestId || null);
    setChannelId(localChannelId || null);
    setActualModel(localModel || null);
    setStatusCode(localStatusCode || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const columnsWithAction: ColumnDef<AuditSummary, any>[] = useMemo(
    () => [
      ...columns,
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => fetchDetail(row.original.x_request_id)}
          >
            详情
          </Button>
        )
      }
    ],
    [fetchDetail]
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-auto">
          <DateTimeRangePicker
            value={dateTimeRange}
            onChange={setDateTimeRange}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="X-Request-ID"
            value={localXRequestId}
            onChange={(e) => setLocalXRequestId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9"
          />
        </div>
        <div className="w-[120px]">
          <Input
            placeholder="渠道 ID"
            value={localChannelId}
            onChange={(e) => setLocalChannelId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9"
          />
        </div>
        <div className="w-[150px]">
          <Input
            placeholder="模型"
            value={localModel}
            onChange={(e) => setLocalModel(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9"
          />
        </div>
        <div className="w-[100px]">
          <Input
            placeholder="状态码"
            value={localStatusCode}
            onChange={(e) => setLocalStatusCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9"
          />
        </div>
        <Button size="sm" onClick={handleSearch} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-1">搜索</span>
        </Button>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columnsWithAction}
        data={data}
        totalItems={total}
        pageSizeOptions={[10, 20, 50, 100]}
        currentPage={page}
        pageSize={pageSize}
        setCurrentPage={(p) => setPage(p)}
        setPageSize={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

      {/* Detail Dialog */}
      <DetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        data={detailData}
        loading={detailLoading}
      />
    </div>
  );
}
