import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store'
};
const failure = (status: number, message: string) =>
  new Response(JSON.stringify({ success: false, message }), {
    status,
    headers
  });

// 限定报表路由，复用现有 auth 和上游认证头约定。
export function requestStatisticsProxy(
  endpoint:
    | '/api/statistics/requests'
    | '/api/statistics/models/requests'
    | '/api/dashboard/models/usage'
) {
  return async (req: NextRequest) => {
    const abort = new AbortController();
    const cancel = () => abort.abort();
    req.signal.addEventListener('abort', cancel, { once: true });
    if (req.signal.aborted) cancel();
    const timeout = setTimeout(cancel, 4000);
    try {
      const session = await auth();
      if (!session?.user?.accessToken) return failure(401, '请先登录');
      if (req.nextUrl.search)
        return failure(400, '筛选条件只能放在 JSON 请求体中');
      if (
        req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
        'application/json'
      )
        return failure(415, '请求体必须为 application/json');
      if (Number(req.headers.get('content-length')) > 8192)
        return failure(413, '请求体超过 8 KiB');
      const reader = req.body?.getReader();
      if (!reader) return failure(400, '请求体必须为 JSON 对象');
      let size = 0;
      const chunks: Uint8Array[] = [];
      const stopReading = () => {
        void reader.cancel();
      };
      abort.signal.addEventListener('abort', stopReading, { once: true });
      try {
        if (abort.signal.aborted)
          return failure(504, '统计代理请求已取消或超时');
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 8192) {
            await reader.cancel();
            return failure(413, '请求体超过 8 KiB');
          }
          chunks.push(value);
        }
      } finally {
        abort.signal.removeEventListener('abort', stopReading);
        reader.releaseLock();
      }
      if (abort.signal.aborted) return failure(504, '统计代理请求已取消或超时');
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) return failure(503, '统计服务地址未配置');
      const response = await fetch(new URL(endpoint, base), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.user.accessToken}`,
          'Ezlinkai-User': String(session.user.id)
        },
        body: Buffer.concat(chunks),
        cache: 'no-store',
        signal: abort.signal,
        redirect: 'error'
      });
      // 原样保留后端 400/403/422/429/503/504 的 JSON 错误及状态。
      return new Response(await response.text(), {
        status: response.status,
        headers
      });
    } catch {
      return failure(
        abort.signal.aborted ? 504 : 502,
        abort.signal.aborted ? '统计代理请求已取消或超时' : '统计服务暂不可用'
      );
    } finally {
      clearTimeout(timeout);
      req.signal.removeEventListener('abort', cancel);
    }
  };
}
