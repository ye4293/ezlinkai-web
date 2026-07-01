'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

interface DateTimeRange {
  from: Date | undefined;
  to: Date | undefined;
}

function getTodayRange() {
  const now = new Date();
  const from = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );
  return { from, to };
}

function toTimestamp(date: Date): string {
  return Math.floor(date.getTime() / 1000).toString();
}

export function useAuditTableFilters() {
  const [xRequestId, setXRequestId] = useQueryState(
    'bq_x_request_id',
    searchParams.bq_x_request_id
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [channelId, setChannelId] = useQueryState(
    'bq_channel_id',
    searchParams.bq_channel_id
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [actualModel, setActualModel] = useQueryState(
    'bq_model',
    searchParams.bq_model
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [statusCode, setStatusCode] = useQueryState(
    'bq_status_code',
    searchParams.bq_status_code
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withOptions({ shallow: true }).withDefault(1)
  );

  const [pageSize, setPageSize] = useQueryState(
    'limit',
    searchParams.limit.withOptions({ shallow: true }).withDefault(10)
  );

  const todayRange = useMemo(() => getTodayRange(), []);

  const [startTimestamp, setStartTimestamp] = useQueryState(
    'start_timestamp',
    searchParams.start_timestamp
      .withOptions({ shallow: true })
      .withDefault(toTimestamp(todayRange.from))
  );

  const [endTimestamp, setEndTimestamp] = useQueryState(
    'end_timestamp',
    searchParams.end_timestamp
      .withOptions({ shallow: true })
      .withDefault(toTimestamp(todayRange.to))
  );

  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>(() => ({
    from: startTimestamp
      ? new Date(parseInt(startTimestamp) * 1000)
      : todayRange.from,
    to: endTimestamp ? new Date(parseInt(endTimestamp) * 1000) : todayRange.to
  }));

  const handleDateTimeRangeChange = useCallback(
    (range: DateTimeRange | undefined) => {
      setDateTimeRange(range || { from: undefined, to: undefined });
      const start = range?.from
        ? Math.floor(range.from.getTime() / 1000).toString()
        : null;
      const end = range?.to
        ? Math.floor(range.to.getTime() / 1000).toString()
        : null;
      setStartTimestamp(start);
      setEndTimestamp(end);
    },
    [setStartTimestamp, setEndTimestamp]
  );

  const resetFilters = useCallback(() => {
    setXRequestId(null);
    setChannelId(null);
    setActualModel(null);
    setStatusCode(null);
    const today = getTodayRange();
    setStartTimestamp(toTimestamp(today.from));
    setEndTimestamp(toTimestamp(today.to));
    setDateTimeRange(today);
    setPage(1);
  }, [
    setXRequestId,
    setChannelId,
    setActualModel,
    setStatusCode,
    setPage,
    setStartTimestamp,
    setEndTimestamp
  ]);

  const isAnyFilterActive = useMemo(() => {
    return !!xRequestId || !!channelId || !!actualModel || !!statusCode;
  }, [xRequestId, channelId, actualModel, statusCode]);

  return {
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
    setDateTimeRange: handleDateTimeRangeChange,
    startTimestamp,
    endTimestamp
  };
}
