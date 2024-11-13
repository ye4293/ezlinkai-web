import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import TokenForm from '../token-form';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Token', link: '/dashboard/token' },
  { title: 'Create', link: '/dashboard/token/create' }
];

export default function TokenViewPage() {
  return (
    <PageContainer scrollable>
      <div className="flex-1 space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <TokenForm />
      </div>
    </PageContainer>
  );
}
