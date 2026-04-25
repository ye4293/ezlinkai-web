'use client';

import { Heading } from '@/components/ui/heading';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';

export default function ChannelPageHeader({ total }: { total: number }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Heading
          title={`${t.channelPage.title} (${total})`}
          description={t.channelPage.description}
        />
      </div>
      <Link
        href="/dashboard/channel/create"
        className={cn(buttonVariants({ variant: 'default' }), 'shrink-0')}
      >
        <Plus className="mr-2 h-4 w-4" /> {t.channelPage.addNew}
      </Link>
    </div>
  );
}
