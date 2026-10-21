'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// 每个调用拥有自己的请求、状态和刷新计时器；查询切换立即隐藏旧结果。
export function useMinuteReport<T>(endpoint: string, query: object | null) {
  const key = query === null ? null : JSON.stringify(query);
  const [revision, setRevision] = useState(0);
  const [automatic, setAutomatic] = useState(false);
  const [state, setState] = useState<{
    key: string | null;
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ key: null, data: null, error: null, loading: false });
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  const cancel = useCallback(() => controller.current?.abort('manual'), []);
  useEffect(() => {
    if (key === null) return;
    const abort = new AbortController();
    controller.current = abort;
    let active = true;
    let timedOut = false;
    setState((old) => ({
      key,
      data: old.key === key ? old.data : null,
      error: null,
      loading: true
    }));
    const timer = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, 8000);
    (async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: key,
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: abort.signal
        });
        const body = await response.json().catch(() => {
          throw new Error('统计服务返回了无法解析的响应，请重试。');
        });
        if (!response.ok || body.success !== true || !body.data)
          throw new Error(body.message || `统计查询失败（${response.status}）`);
        if (active)
          setState({ key, data: body.data as T, error: null, loading: false });
      } catch (error) {
        if (active)
          setState((old) => ({
            ...old,
            key,
            error: timedOut
              ? '统计查询超时，请重试或缩小范围。'
              : abort.signal.aborted
              ? '已取消查询。'
              : error instanceof Error
              ? error.message
              : '统计查询失败。',
            loading: false
          }));
      } finally {
        clearTimeout(timer);
      }
    })();
    return () => {
      active = false;
      clearTimeout(timer);
      abort.abort();
    };
  }, [endpoint, key, revision]);
  useEffect(() => {
    if (!automatic || key === null) return;
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [automatic, key, refresh]);
  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : null,
    loading: key !== null && (state.key !== key || state.loading),
    refresh,
    cancel,
    automatic,
    setAutomatic
  };
}
