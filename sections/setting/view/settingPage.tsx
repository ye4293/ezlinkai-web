// import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { GitHubSignInButton } from './GitHubSignInButton';
import SelectMultiple from './selectMultiple';
const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Setting', link: '/dashboard/setting' }
];

export default async function SettingPage() {
  const session = await auth();
  console.log('session', session);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <Separator />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Setting</h2>
        </div>

        <div className="flex gap-4">
          <Link
            href={'/dashboard/setting/updateUser'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Profile Information
          </Link>

          {/* <GitHubSignInButton /> */}
          {/* <SelectMultiple /> */}
        </div>
      </div>
    </PageContainer>
  );
}
