import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: `/api/channel/test/:id`,
  useParams: true
});

export const GET = handler.get;
