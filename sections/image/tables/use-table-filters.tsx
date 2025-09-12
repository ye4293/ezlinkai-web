'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

interface DateTimeRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const STATUS_OPTIONS = [
  { value: '1', label: 'Enabled' },
  { value: '2', label: 'Disabled' }
];

export function useTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [taskId, setTaskId] = useQueryState(
    'task_id',
    searchParams.task_id
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [provider, setProvider] = useQueryState(
    'provider',
    searchParams.provider
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [modelName, setModelName] = useQueryState(
    'model_name',
    searchParams.model_name
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [channelId, setChannelId] = useQueryState(
    'channel',
    searchParams.channel
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [userName, setUserName] = useQueryState(
    'username',
    searchParams.username
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const [pageSize, setPageSize] = useQueryState(
    'limit',
    searchParams.limit.withOptions({ shallow: false }).withDefault(10)
  );

  const [startTimestamp, setStartTimestamp] = useQueryState(
    'start_timestamp',
    searchParams.start_timestamp.withOptions({ shallow: false }).withDefault('')
  );

  const [endTimestamp, setEndTimestamp] = useQueryState(
    'end_timestamp',
    searchParams.end_timestamp.withOptions({ shallow: false }).withDefault('')
  );

  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>(() => ({
    from: startTimestamp
      ? new Date(parseInt(startTimestamp) * 1000)
      : undefined,
    to: endTimestamp ? new Date(parseInt(endTimestamp) * 1000) : undefined
  }));

  // 将日期时间转换为秒级时间戳
  const handleDateTimeRangeChange = useCallback(
    (range: DateTimeRange | undefined) => {
      setDateTimeRange(range || { from: undefined, to: undefined });

      // 直接使用精确的时间戳（秒）
      const startTimestamp = range?.from
        ? Math.floor(range.from.getTime() / 1000).toString()
        : null;
      const endTimestamp = range?.to
        ? Math.floor(range.to.getTime() / 1000).toString()
        : null;

      setStartTimestamp(startTimestamp);
      setEndTimestamp(endTimestamp);
    },
    [setStartTimestamp, setEndTimestamp]
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTaskId(null);
    setProvider(null);
    setModelName(null);
    setChannelId(null);
    setUserName(null);
    setStartTimestamp(null);
    setEndTimestamp(null);
    setDateTimeRange({ from: undefined, to: undefined });

    setPage(1);
  }, [
    setSearchQuery,
    setTaskId,
    setProvider,
    setModelName,
    setChannelId,
    setUserName,
    setPage,
    setStartTimestamp,
    setEndTimestamp,
    setDateTimeRange
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      !!taskId ||
      !!provider ||
      !!modelName ||
      !!channelId ||
      !!userName ||
      !!startTimestamp ||
      !!endTimestamp
    );
  }, [
    searchQuery,
    taskId,
    provider,
    modelName,
    channelId,
    userName,
    startTimestamp,
    endTimestamp
  ]);

  return {
    searchQuery,
    setSearchQuery,
    taskId,
    setTaskId,
    provider,
    setProvider,
    modelName,
    setModelName,
    channelId,
    setChannelId,
    userName,
    setUserName,
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
