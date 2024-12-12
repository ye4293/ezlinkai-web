import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/user/self'
});

export const GET = handler.get;
export const PUT = handler.put;
