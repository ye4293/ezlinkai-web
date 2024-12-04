import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import UserTable from '../tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserSelf } from '@/lib/types';
// import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'User', link: '/dashboard/user' }
];

type TUserListingPage = {};

export default async function UserListingPage({}: TUserListingPage) {
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
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/user/search?${params}`;
  const res = await fetch(baseUrl, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${session?.user?.accessToken}`
    }
  });
  const { data } = await res.json();
  const totalUsers = (data && data.total) || 0;
  const user: UserSelf[] = (data && data.list) || [];
  // mock api call
  // const data = await fakeUsers.getUsers(filters);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`User (${totalUsers})`}
            description="Manage User (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/user/create'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <UserTable data={user} totalData={totalUsers} />
      </div>
    </PageContainer>
  );
}
