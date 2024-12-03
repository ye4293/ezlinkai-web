import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/user'
});

export const POST = handler.post;
export const PUT = handler.put;
