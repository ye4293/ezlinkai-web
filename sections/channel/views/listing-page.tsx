import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import OptimizedChannelTable from '../tables/optimized-channel-table';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Channel } from '@/lib/types/channel';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { cache } from 'react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Channel', link: '/dashboard/channel' }
];

type TChannelListingPage = {};

// 缓存数据获取函数
const getChannelData = cache(
  async (params: URLSearchParams, accessToken: string) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL + `/api/channel/search?${params}`;

      const res = await fetch(baseUrl, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' // 添加缓存头
        },
        next: {
          revalidate: 60, // ISR: 60秒重新验证
          tags: ['channel-list'] // 标记缓存，便于失效
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const { data } = await res.json();
      return {
        total: (data && data.total) || 0,
        channels: (data && data.list) || ([] as Channel[])
      };
    } catch (error) {
      console.error('Failed to fetch channel data:', error);
      return { total: 0, channels: [] as Channel[] };
    }
  }
);

export default async function ChannelListingPage({}: TChannelListingPage) {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const status = searchParamsCache.get('status');
  const pageLimit = searchParamsCache.get('limit');

  const params = new URLSearchParams({
    page: String(page),
    pagesize: String(pageLimit),
    ...(search && { keyword: search }),
    ...(status && { status: status })
  });

  const session = await auth();

  if (!session?.user?.accessToken) {
    return (
      <PageContainer>
        <div className="py-8 text-center">
          <p className="text-red-500">认证失败，请重新登录</p>
        </div>
      </PageContainer>
    );
  }

  const { total: totalData, channels } = await getChannelData(
    params,
    session.user.accessToken
  );

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`Channels (${totalData})`}
            description="Manage channels (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/channel/create'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <OptimizedChannelTable
          initialData={channels}
          initialTotal={totalData}
        />
      </div>
    </PageContainer>
  );
}
