import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Separator } from '@/components/ui/separator';
import ModelView from '@/sections/model/model-view';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Model', link: '/dashboard/model' }
];

export const metadata = {
  title: 'Model'
};

export default function Page() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">模型渠道挂载</h1>
        </div>
        <Separator />
        <ModelView />
      </div>
    </PageContainer>
  );
}
