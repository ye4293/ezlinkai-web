'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';

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

  const [mjId, setMjId] = useQueryState(
    'mj_id',
    searchParams.mj_id
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

  const [startTimestamp, setStartTimestamp] = useQueryState(
    'start_timestamp',
    searchParams.start_timestamp.withOptions({ shallow: false }).withDefault('')
  );

  const [endTimestamp, setEndTimestamp] = useQueryState(
    'end_timestamp',
    searchParams.end_timestamp.withOptions({ shallow: false }).withDefault('')
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: startTimestamp
      ? new Date(parseInt(startTimestamp) * 1000)
      : undefined,
    to: endTimestamp ? new Date(parseInt(endTimestamp) * 1000) : undefined
  }));

  // 将日期转换为秒级时间戳
  const handleDateRangeChange = useCallback(
    (range: DateRange | undefined) => {
      setDateRange(range);
      // 如果有开始日期，设置为当天开始时间的时间戳（秒）
      const startTimestamp = range?.from
        ? Math.floor(
            new Date(range.from.setHours(0, 0, 0, 0)).getTime() / 1000
          ).toString()
        : null;
      // 如果有结束日期，设置为当天结束时间的时间戳（秒）
      const endTimestamp = range?.to
        ? Math.floor(
            new Date(range.to.setHours(23, 59, 59, 999)).getTime() / 1000
          ).toString()
        : null;

      setStartTimestamp(startTimestamp);
      setEndTimestamp(endTimestamp);
    },
    [setStartTimestamp, setEndTimestamp]
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setMjId(null);
    setChannelId(null);
    setUserName(null);
    setStartTimestamp(null);
    setEndTimestamp(null);
    setDateRange({ from: undefined, to: undefined });

    setPage(1);
  }, [
    setMjId,
    setChannelId,
    setUserName,
    setPage,
    setStartTimestamp,
    setEndTimestamp,
    setDateRange
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!mjId || !!channelId || !!userName || !!startTimestamp || !!endTimestamp
    );
  }, [mjId, channelId, userName, startTimestamp, endTimestamp]);

  return {
    mjId,
    setMjId,
    channelId,
    setChannelId,
    userName,
    setUserName,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    dateRange,
    setDateRange: handleDateRangeChange,
    startTimestamp,
    endTimestamp
  };
}
