import { auth } from '@/auth';
import { NextRequest } from 'next/server';

/**
 * 创建一个代理到后端 API 的 GET 请求处理函数，支持动态路径参数
 * 用于 ApiHandler 无法处理的嵌套动态路由场景（如 /channel/[id]/keys/stats）
 */
export function createProxyGet(buildPath: (id: string) => string) {
  return async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;
      const session = await auth();
      if (!session?.user?.accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const url = new URL(`${baseUrl}${buildPath(id)}`);
      req.nextUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });

      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.user.accessToken}`
      };
      if (session.user.id) {
        headers['Ezlinkai-User'] = String(session.user.id);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        redirect: 'follow'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return new Response(
          JSON.stringify({
            error: errorData || 'API request failed',
            status: response.status,
            message: response.statusText
          }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}
