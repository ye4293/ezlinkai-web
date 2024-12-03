import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/charge/create_order'
});

export const POST = handler.post;
