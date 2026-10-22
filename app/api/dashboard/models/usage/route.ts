import { requestStatisticsProxy } from '@/app/lib/request-statistics-proxy';

export const dynamic = 'force-dynamic';
export const POST = requestStatisticsProxy('/api/dashboard/models/usage');
