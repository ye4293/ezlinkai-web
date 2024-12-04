import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
// import { ScrollArea } from '@/components/ui/scroll-area';
import UserForm from '../user-form';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'User', link: '/dashboard/user' },
  { title: 'Create', link: '/dashboard/user/create' }
];

export default function UserViewPage() {
  return (
    <PageContainer scrollable>
      <div className="flex-1 space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <UserForm />
      </div>
    </PageContainer>
  );
}
