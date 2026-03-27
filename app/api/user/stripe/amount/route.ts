import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/user/stripe/amount'
});

export const POST = handler.post;
