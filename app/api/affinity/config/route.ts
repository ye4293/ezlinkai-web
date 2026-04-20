import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/affinity/config',
  requireAuth: true
});

export const GET = handler.get;
export const PUT = handler.put;
