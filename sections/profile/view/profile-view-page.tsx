import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import ProfileCreateForm from '../profile-create-form';
import { SystemTokenCard } from '../system-token-card';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Profile', link: '/dashboard/profile' }
];

export default function ProfileViewPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <SystemTokenCard />
        <ProfileCreateForm categories={[]} initialData={null} />
      </div>
    </PageContainer>
  );
}
