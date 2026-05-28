'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

interface DateTimeRange {
  from: Date | undefined;
  to: Date | undefined;
}

// 获取当天时间范围
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

export const STATUS_OPTIONS = [
  { value: '1', label: 'Enabled' },
  { value: '2', label: 'Disabled' }
];

export function useTableFilters() {
  // const [searchQuery, setSearchQuery] = useQueryState(
  //   'q',
  //   searchParams.q
  //     .withOptions({ shallow: true, throttleMs: 1000 })
  //     .withDefault('')
  // );

  const [tokenName, setTokenName] = useQueryState(
    'token_name',
    searchParams.token_name
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [modelName, setModelName] = useQueryState(
    'model_name',
    searchParams.model_name
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [channelId, setChannelId] = useQueryState(
    'channel',
    searchParams.channel
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [userName, setUserName] = useQueryState(
    'username',
    searchParams.username
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [xRequestId, setXRequestId] = useQueryState(
    'x_request_id',
    searchParams.x_request_id
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [xResponseId, setXResponseId] = useQueryState(
    'x_response_id',
    searchParams.x_response_id
      .withOptions({ shallow: true, throttleMs: 1000 })
      .withDefault('')
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    'type',
    searchParams.type.withOptions({ shallow: true }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withOptions({ shallow: true }).withDefault(1)
  );

  const [pageSize, setPageSize] = useQueryState(
    'limit',
    searchParams.limit.withOptions({ shallow: true }).withDefault(10)
  );

  // 默认带上当天时间范围
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
    // setSearchQuery(null);
    setTokenName(null);
    setModelName(null);
    setChannelId(null);
    setUserName(null);
    setXRequestId(null);
    setXResponseId(null);
    setTypeFilter(null);
    // 重置时间为当天
    const today = getTodayRange();
    setStartTimestamp(toTimestamp(today.from));
    setEndTimestamp(toTimestamp(today.to));
    setDateTimeRange(today);

    setPage(1);
  }, [
    setTokenName,
    setModelName,
    setChannelId,
    setUserName,
    setXRequestId,
    setXResponseId,
    setTypeFilter,
    setPage,
    setStartTimestamp,
    setEndTimestamp,
    setDateTimeRange
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!tokenName ||
      !!modelName ||
      !!channelId ||
      !!userName ||
      !!xRequestId ||
      !!xResponseId ||
      !!typeFilter
    );
  }, [
    tokenName,
    modelName,
    channelId,
    userName,
    xRequestId,
    xResponseId,
    typeFilter
  ]);

  return {
    tokenName,
    setTokenName,
    modelName,
    setModelName,
    channelId,
    setChannelId,
    userName,
    setUserName,
    xRequestId,
    setXRequestId,
    xResponseId,
    setXResponseId,
    typeFilter,
    setTypeFilter,
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
