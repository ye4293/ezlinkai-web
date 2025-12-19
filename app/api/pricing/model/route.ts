import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/pricing/model',
  requireAuth: true
});

export const PUT = handler.put;
