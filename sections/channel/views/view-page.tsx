import { Breadcrumbs } from '@/components/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChannelForm from '../channel-form';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Channel', link: '/dashboard/channel' },
  { title: 'Create', link: '/dashboard/channel/create' }
];

export default function ChannelViewPage() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <ChannelForm />
      </div>
    </ScrollArea>
  );
}
