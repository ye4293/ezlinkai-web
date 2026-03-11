import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestBody = await req.json();
    const apiKey =
      typeof requestBody.apiKey === 'string' ? requestBody.apiKey.trim() : '';
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'A valid API key is required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { apiKey: _, ...payload } = requestBody;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(errText, {
        status: response.status,
        headers: {
          'Content-Type':
            response.headers.get('content-type') || 'application/json'
        }
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream') && response.body) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      });
    }

    const data = await response.text();
    return new Response(data, {
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
}
