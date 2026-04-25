'use client';

import { Heading } from '@/components/ui/heading';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';

export default function UserPageHeader({ total }: { total: number }) {
  const { t } = useLocale();
  return (
    <div className="flex items-start justify-between">
      <Heading
        title={`${t.userPage.title} (${total})`}
        description={t.userPage.description}
      />
      <Link
        href="/dashboard/user/create"
        className={cn(buttonVariants({ variant: 'default' }))}
      >
        <Plus className="mr-2 h-4 w-4" /> {t.userPage.addNew}
      </Link>
    </div>
  );
}
