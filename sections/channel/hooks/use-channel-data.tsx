'use client';

import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/lib/types/channel';
import request from '@/app/lib/clientFetch';
import {
  fetchWithCache,
  generateCacheKey,
  invalidateCache
} from '@/lib/cache-utils';

interface ChannelListResponse {
  list: Channel[];
  total: number;
  currentPage: number;
  type_counts?: Record<number, number>;
}

interface UseChannelDataParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  type?: string;
}

interface UseChannelDataReturn {
  data: Channel[];
  total: number;
  typeCounts: Record<number, number>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useChannelData = ({
  page,
  pageSize,
  keyword,
  status,
  type
}: UseChannelDataParams): UseChannelDataReturn => {
  const [data, setData] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [typeCounts, setTypeCounts] = useState<Record<number, number>>({});
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
        ...(status && { status }),
        ...(type && { type })
      });

      const cacheKey = generateCacheKey('channels', {
        page,
        pageSize,
        keyword,
        status,
        type
      });

      const response = await fetchWithCache(
        cacheKey,
        () =>
          request.get<{ data: ChannelListResponse }>(
            `/api/channel/search?${params}`
          ),
        2 * 60 * 1000 // 2分钟缓存
      );

      // response 是从 clientFetch 返回的，结构是 { data: { list: [], total: 0, type_counts: {} } }
      const data = response as unknown as { data: ChannelListResponse };

      if (data?.data?.list) {
        setData(data.data.list);
        setTotal(data.data.total || 0);
        // 保存类型统计数据
        if (data.data.type_counts) {
          setTypeCounts(data.data.type_counts);
        }
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
  }, [page, pageSize, keyword, status, type]);

  const refetch = useCallback(async () => {
    // 清除相关缓存，确保获取最新数据
    invalidateCache('channels');
    await fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    data,
    total,
    typeCounts,
    loading,
    error,
    refetch
  };
};
