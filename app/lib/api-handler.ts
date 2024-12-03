import { auth } from '@/auth';
import { NextRequest } from 'next/server';

interface ApiHandlerOptions {
  requireAuth?: boolean;
  endpoint: string;
}

export class ApiHandler {
  private baseUrl: string;
  private endpoint: string;
  private requireAuth: boolean;

  constructor(options: ApiHandlerOptions) {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    this.endpoint = options.endpoint;
    this.requireAuth = options.requireAuth ?? true;
  }

  private async getAuthHeaders() {
    const session = await auth();
    return session?.user?.accessToken
      ? { Authorization: `Bearer ${session.user.accessToken}` }
      : {};
  }

  private async handleRequest(req: NextRequest, method: string) {
    try {
      // 构建完整的 URL
      const url = new URL(this.baseUrl + this.endpoint);

      // 添加所有查询参数
      req.nextUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });

      // 获取认证头
      const authHeaders = this.requireAuth ? await this.getAuthHeaders() : {};

      // 只保留需要的请求头
      const headers = new Headers();
      ['content-type', 'accept', 'user-agent'].forEach((header) => {
        const value = req.headers.get(header);
        if (value) headers.set(header, value);
      });

      // 合并认证头
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: method !== 'GET' ? await req.text() : undefined,
        redirect: 'follow'
      });

      if (!response.ok) {
        // 尝试解析错误响应
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
      console.error('API Handler Error:', error);
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
  }

  public get = (req: NextRequest) => this.handleRequest(req, 'GET');
  public post = (req: NextRequest) => this.handleRequest(req, 'POST');
  public put = (req: NextRequest) => this.handleRequest(req, 'PUT');
  public delete = (req: NextRequest) => this.handleRequest(req, 'DELETE');
}
