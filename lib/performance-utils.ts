import { useCallback, useRef } from 'react';

/**
 * 防抖钩子 - 优化频繁的函数调用
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback as T;
}

/**
 * 节流钩子 - 限制函数调用频率
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );

  return throttledCallback as T;
}

/**
 * 批量状态更新 - 减少重新渲染次数
 */
export function batchUpdates(callback: () => void) {
  // 在React 18中，大多数更新已经自动批处理
  // 但我们可以使用setTimeout来确保批处理
  setTimeout(callback, 0);
}

/**
 * 内存化计算结果 - 避免重复计算
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    // 限制缓存大小，避免内存泄漏
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

/**
 * 虚拟滚动计算工具
 */
export class VirtualScrollCalculator {
  private itemHeight: number;
  private containerHeight: number;
  private totalItems: number;

  constructor(itemHeight: number, containerHeight: number, totalItems: number) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.totalItems = totalItems;
  }

  getVisibleRange(scrollTop: number): { start: number; end: number } {
    const start = Math.floor(scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const end = Math.min(start + visibleCount + 1, this.totalItems);

    return { start: Math.max(0, start), end };
  }

  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }

  getItemTop(index: number): number {
    return index * this.itemHeight;
  }
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-start`);
    }
  }

  endTiming(label: string): number | null {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      const measure = performance.getEntriesByName(label)[0];
      const duration = measure?.duration || 0;

      // 记录性能指标
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }

      const measurements = this.metrics.get(label)!;
      measurements.push(duration);

      // 只保留最近的100次测量
      if (measurements.length > 100) {
        measurements.shift();
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
    return null;
  }

  getAverageTime(label: string): number {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) return 0;

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    this.metrics.forEach((measurements, label) => {
      result[label] = {
        average: this.getAverageTime(label),
        count: measurements.length
      };
    });

    return result;
  }
}

/**
 * 图片懒加载工具
 */
export function createImageLoader() {
  const imageCache = new Set<string>();

  return {
    preloadImage: (src: string): Promise<void> => {
      if (imageCache.has(src)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.add(src);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    },

    isImageCached: (src: string): boolean => {
      return imageCache.has(src);
    }
  };
}

/**
 * 数据预取工具
 */
export class DataPrefetcher {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟缓存

  async prefetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // 检查缓存是否有效
    if (cached && now - cached.timestamp < this.TTL) {
      return cached.data;
    }

    // 获取新数据
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: now });

    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
