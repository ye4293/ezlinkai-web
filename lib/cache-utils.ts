// 客户端数据缓存工具

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ClientCache {
  private cache = new Map<string, CacheItem>();

  // 设置缓存，默认5分钟过期
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    this.cache.set(key, item);
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // 删除缓存
  delete(key: string): void {
    this.cache.delete(key);
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }

  // 检查缓存是否存在且有效
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// 创建全局缓存实例
const cache = new ClientCache();

// 生成缓存键
export const generateCacheKey = (
  prefix: string,
  params: Record<string, any>
): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = params[key];
        return result;
      },
      {} as Record<string, any>
    );

  return `${prefix}:${JSON.stringify(sortedParams)}`;
};

// 带缓存的数据获取函数
export const fetchWithCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // 先检查缓存
  const cached = cache.get<T>(key);
  if (cached) {
    return cached;
  }

  // 缓存未命中，执行获取
  const data = await fetcher();

  // 存入缓存
  cache.set(key, data, ttl);

  return data;
};

// 预加载数据
export const preloadData = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<void> => {
  // 如果已经有缓存就不预加载
  if (cache.has(key)) return;

  try {
    const data = await fetcher();
    cache.set(key, data, ttl);
  } catch (error) {
    // 预加载失败，静默忽略
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Preload failed:', error);
    }
  }
};

// 缓存失效
export const invalidateCache = (pattern: string): void => {
  cache.clear(); // 简化实现，清空所有缓存
};

export default cache;
