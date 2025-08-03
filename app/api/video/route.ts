import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/video'
});

export const GET = handler.get;
export const POST = handler.post;
export const PUT = handler.put;
export const DELETE = handler.delete;
