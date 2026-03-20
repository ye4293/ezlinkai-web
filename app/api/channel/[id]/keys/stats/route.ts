import { createProxyGet } from '@/app/lib/proxy-handler';

export const GET = createProxyGet((id) => `/api/channel/${id}/keys/stats`);
