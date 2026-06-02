import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/upstream_updates/apply_all'
});

export const POST = handler.post;
