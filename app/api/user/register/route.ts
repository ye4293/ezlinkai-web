import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/user/register',
  requireAuth: false
});

export const POST = handler.post;
