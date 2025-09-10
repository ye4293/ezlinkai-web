'use client';

import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/lib/types';
import request from '@/app/lib/clientFetch';
import { fetchWithCache, generateCacheKey } from '@/lib/cache-utils';

interface ChannelListResponse {
  list: Channel[];
  total: number;
  currentPage: number;
}

interface UseChannelDataParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

interface UseChannelDataReturn {
  data: Channel[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useChannelData = ({
  page,
  pageSize,
  keyword,
  status
}: UseChannelDataParams): UseChannelDataReturn => {
  const [data, setData] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pagesize: String(pageSize),
        ...(keyword && { keyword }),
        ...(status && { status })
      });

      const cacheKey = generateCacheKey('channels', {
        page,
        pageSize,
        keyword,
        status
      });

      const response = await fetchWithCache(
        cacheKey,
        () =>
          request.get<{ data: ChannelListResponse }>(
            `/api/channel/search?${params}`
          ),
        2 * 60 * 1000 // 2分钟缓存
      );

      // response 是从 clientFetch 返回的，结构是 { data: { list: [], total: 0 } }
      const data = response as unknown as { data: ChannelListResponse };

      if (data?.data?.list) {
        setData(data.data.list);
        setTotal(data.data.total || 0);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, status]);

  const refetch = useCallback(async () => {
    await fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    data,
    total,
    loading,
    error,
    refetch
  };
};
