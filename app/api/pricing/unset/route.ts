import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/pricing/unset',
  requireAuth: true
});

export const GET = handler.get;
