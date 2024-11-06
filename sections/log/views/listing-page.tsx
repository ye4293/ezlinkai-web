import { cookies } from 'next/headers';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import LogTable from '../tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Channel } from '@/lib/types';
// import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Log', link: '/dashboard/log' }
];

type TLogListingPage = {};

export default async function LogListingPage({}: TLogListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');
  const tokenName = searchParamsCache.get('token_name');
  const modelName = searchParamsCache.get('model_name');
  const channel = searchParamsCache.get('channel');
  const username = searchParamsCache.get('username');
  const type = searchParamsCache.get('type');
  const startTime = searchParamsCache.get('start_timestamp');
  const endTime = searchParamsCache.get('end_timestamp');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(tokenName && { token_name: tokenName }),
    ...(modelName && { model_name: modelName }),
    ...(channel && { channel }),
    ...(username && { username }),
    ...(type && { type }),
    ...(startTime && { start_timestamp: startTime }),
    ...(endTime && { end_timestamp: endTime })
  };

  const params = new URLSearchParams({
    page: String(page),
    pagesize: String(pageLimit),
    ...(search && { keyword: search }),
    ...(tokenName && { token_name: tokenName }),
    ...(modelName && { model_name: modelName }),
    ...(channel && { channel: String(channel) }),
    ...(username && { username }),
    ...(type && { type: String(type) }),
    ...(startTime && { start_timestamp: String(startTime) }),
    ...(endTime && { end_timestamp: String(endTime) })
  });
  const _cookie = 'session=' + cookies().get('session')?.value + '==';
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/log/self?${params}`;
  // console.log('baseUrl', baseUrl)
  const res = await fetch(
    // process.env.NEXT_PUBLIC_API_BASE_URL + `/api/channel/search?page=${params.page}&pagesize=${params.pagesize}`,
    baseUrl,
    {
      credentials: 'include',
      headers: {
        Cookie: _cookie
      }
    }
  );
  const { data } = await res.json();
  console.log('----data----', data);
  // console.log('----data----', data.currentPage)
  // console.log('----params----', params)
  const totalUsers = (data && data.total) || 0;
  const logData: Channel[] = (data && data.list) || [];
  // mock api call
  // const data = await fakeUsers.getUsers(filters);
  // const totalUsers = data.total_users;
  // const channel: Channel[] = data.users;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        {/* <div className="flex items-start justify-between">
          <Heading
            title={`Channels (${totalUsers})`}
            description="Manage channels (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/channel/create'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div> */}
        <Separator />
        <LogTable data={logData} totalData={totalUsers} />
      </div>
    </PageContainer>
  );
}
