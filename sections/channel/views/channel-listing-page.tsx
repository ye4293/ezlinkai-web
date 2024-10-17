import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import ChannelTable from '../channel-tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Channel } from '@/constants/data';
import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Channel', link: '/dashboard/channel' }
];

type TChannelListingPage = {};

export default async function ChannelListingPage({}: TChannelListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const gender = searchParamsCache.get('gender');
  const pageLimit = searchParamsCache.get('limit');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(gender && { genders: gender })
  };

  // mock api call
  const data = await fakeUsers.getUsers(filters);
  const totalUsers = data.total_users;
  const channel: Channel[] = data.users;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`Employee (${totalUsers})`}
            description="Manage employees (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/employee/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <ChannelTable data={channel} totalData={totalUsers} />
      </div>
    </PageContainer>
  );
}
