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
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <TokenForm />
      </div>
    </ScrollArea>
  );
}
