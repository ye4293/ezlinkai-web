import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/keys/delete-disabled'
});

export const POST = handler.post;
