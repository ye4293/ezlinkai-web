import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/reset_password',
  requireAuth: false
});

export const GET = handler.get;
