import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { renderQuota } from '@/utils/render';
import TopupForm from '../topup-form';
import PaymentSection from '../payment-section';
import InviteCard from '../invite-card';
import TransactionHistory from '../transaction-history';
import { Wallet } from 'lucide-react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Topup', link: '/dashboard/topup' }
];

export default async function TopupPage() {
  const session = await auth();

  // Fetch user info (balance, etc.)
  const userRes = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/user/self`,
    {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${session?.user?.accessToken}`
      }
    }
  );
  const { data: userData } = await userRes.json();

  // Fetch crypto payment info
  let topUpLink = '';
  let paymentUri = '';
  try {
    const payRes = await fetch(
      process.env.NEXT_PUBLIC_API_BASE_URL + `/api/pay/get_qrcode`,
      {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`
        }
      }
    );
    const upLinkData = await payRes.json();
    if (upLinkData?.data?.qr_code) {
      topUpLink = `data:image/png;base64,${upLinkData.data.qr_code}`;
    }
    paymentUri = upLinkData?.data?.payment_uri || '';
  } catch (e) {
    console.error('Failed to fetch payment QR code');
  }

  return (
    <PageContainer scrollable>
      <div className="space-y-6 pb-8">
        <div className="space-y-2">
          <Breadcrumbs items={breadcrumbItems} />
          <Separator />
        </div>

        {/* Account Balance Card */}
        <Card className="border-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-white/20 p-3">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-blue-100">
                Current Balance
              </p>
              <h2 className="text-3xl font-bold tracking-tight">
                {renderQuota(userData?.quota || 0)}
              </h2>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Topup & Payment */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <PaymentSection topUpLink={topUpLink} paymentUri={paymentUri} />
          </div>

          {/* Right Column: Invite & Rewards */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <InviteCard user={userData} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <TopupForm />
          </div>
        </div>

        {/* Bottom Section: Transaction History */}
        <TransactionHistory />
      </div>
    </PageContainer>
  );
}
