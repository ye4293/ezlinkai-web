import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/test/smtp',
  requireAuth: true
});

export const POST = handler.post;
