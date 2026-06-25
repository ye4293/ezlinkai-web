import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import AuditTable from '../tables';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Audit', link: '/dashboard/bigquery' }
];

export default function AuditListingPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <Separator />
        <AuditTable />
      </div>
    </PageContainer>
  );
}
