import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: `/api/channel/update_balance/:id`,
  useParams: true
});

export const GET = handler.get;
