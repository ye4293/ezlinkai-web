// import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  // const _cookie = 'session=' + cookies().get('session')?.value + '==';
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL + `/api/channel/models`;
    const response = await fetch(baseUrl, {
      headers: {
        ...req.headers, // 将请求头传递给外部 API
        // Cookie: _cookie
        Authorization: `Bearer ${session?.user?.accessToken}`
      },
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
