// import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

// 通用的请求处理函数
async function handleRequest(req: NextRequest, method: string) {
  const session = await auth();
  // const _cookie = 'session=' + cookies().get('session')?.value + '==';
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + `/api/channel`;

    const response = await fetch(baseUrl, {
      method: method,
      headers: {
        ...req.headers,
        // Cookie: _cookie
        Authorization: `Bearer ${session?.user?.accessToken}`
      },
      body: method !== 'GET' ? await req.text() : undefined,
      redirect: 'follow'
    });

    if (!response.ok) {
      return new Response('Error fetching data', { status: response.status });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

// GET 方法
export async function GET(req: NextRequest) {
  return handleRequest(req, 'GET');
}

// POST 方法
export async function POST(req: NextRequest) {
  return handleRequest(req, 'POST');
}

// PUT 方法
export async function PUT(req: NextRequest) {
  return handleRequest(req, 'PUT');
}
