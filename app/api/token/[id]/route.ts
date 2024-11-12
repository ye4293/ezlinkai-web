import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const _cookie = 'session=' + cookies().get('session')?.value + '==';
//     const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + `/api/channel/${params.id}`;

//     const response = await fetch(baseUrl, {
//       headers: {
//         ...Object.fromEntries(request.headers),
//         Cookie: _cookie
//       },
//       redirect: 'follow'
//     });

//     if (!response.ok) {
//       return NextResponse.json(
//         { success: false, message: '数据获取失败' },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
//     return NextResponse.json({ success: true, data });

//   } catch (error) {
//     return NextResponse.json(
//       { success: false, message: '请求失败', error: error instanceof Error ? error.message : '未知错误' },
//       { status: 500 }
//     );
//   }
// }

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const _cookie = 'session=' + cookies().get('session')?.value + '==';
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL + `/api/token/${params.id}`;
    const response = await fetch(baseUrl, {
      headers: {
        ...req.headers, // 将请求头传递给外部 API
        Cookie: _cookie
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const _cookie = 'session=' + cookies().get('session')?.value + '==';
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL + `/api/token/${params.id}`;
    const response = await fetch(baseUrl, {
      method: 'DELETE', // 使用 DELETE 方法
      headers: {
        ...req.headers,
        Cookie: _cookie
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return new Response('Error deleting data', { status: response.status });
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
