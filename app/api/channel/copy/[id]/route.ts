import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: `/api/channel/copy/:id`,
  useParams: true
});

export const POST = handler.post;
