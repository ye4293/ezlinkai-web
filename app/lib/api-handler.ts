import { auth } from '@/auth';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from './session';

interface ApiHandlerOptions {
  requireAuth?: boolean;
  endpoint: string;
  useParams?: boolean;
}

export class ApiHandler {
  private baseUrl: string;
  private endpoint: string;
  private requireAuth: boolean;
  private useParams: boolean;

  constructor(options: ApiHandlerOptions) {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    this.endpoint = options.endpoint;
    this.requireAuth = options.requireAuth ?? true;
    this.useParams = options.useParams ?? false;
  }

  private async getAuthHeaders() {
    const session = await auth();
    return session?.user?.accessToken
      ? { Authorization: `Bearer ${session.user.accessToken}` }
      : {};
  }

  private async handleRequest(req: NextRequest, method: string) {
    try {
      let endpoint = this.endpoint;

      // 处理路由参数
      if (this.useParams) {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const paramPattern = /:[a-zA-Z]+/g;

        // 替换所有 :param 形式的参数
        endpoint = endpoint.replace(paramPattern, () => {
          const paramValue = pathParts[pathParts.length - 1]; // 获取URL最后一段作为参数值
          return paramValue;
        });
      }

      const url = new URL(this.baseUrl + endpoint);
      req.nextUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });

      const authHeaders = this.requireAuth ? await this.getAuthHeaders() : {};
      const headers = new Headers();

      // 合并认证头
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      // 构建请求选项
      const fetchOptions: RequestInit = {
        method,
        headers,
        redirect: 'follow'
      };

      // 只对非 GET 请求处理请求体
      if (method !== 'GET') {
        const contentType = req.headers.get('content-type');
        const body = await req.text();

        if (body) {
          fetchOptions.body = body;
          headers.set('content-type', contentType || 'application/json');
          headers.set('content-length', Buffer.byteLength(body).toString());
        }
      }

      const response = await fetch(url.toString(), fetchOptions);

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
      if (process.env.NODE_ENV === 'development') {
        console.error('API Handler Error:', error);
      }
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

export async function apiHandler(handler: any) {
  const session = await getSession();
  return async (req: NextRequest) => {
    try {
      const method = req.method;
      const endpoint = req.nextUrl.pathname;
      const handlerInstance = new ApiHandler({ endpoint, requireAuth: true });

      let response;
      let status = 500;
      let headers = {};

      if (method === 'GET') {
        response = await handlerInstance.get(req);
        status = response.status;
        headers = response.headers;
      } else if (method === 'POST') {
        response = await handlerInstance.post(req);
        status = response.status;
        headers = response.headers;
      } else if (method === 'PUT') {
        response = await handlerInstance.put(req);
        status = response.status;
        headers = response.headers;
      } else if (method === 'DELETE') {
        response = await handlerInstance.delete(req);
        status = response.status;
        headers = response.headers;
      } else {
        return new Response('Method Not Allowed', { status: 405 });
      }

      return new Response(response, { status, headers });
    } catch (error: any) {
      // global error handler
      if (typeof error === 'string') {
        // custom application error
        const isInvalidJson =
          error.startsWith('Invalid JSON:') ||
          error.startsWith('Invalid JSON:');
        if (isInvalidJson) {
          return new Response(error, { status: 400 });
        }
        return new Response(error, { status: 400 });
      }

      if (error.name === 'JsonWebTokenError') {
        return new Response('Unauthorized', { status: 401 });
      }

      // default to 500 server error
      return new Response(error.message, { status: 500 });
    }
  };
}
