import { cookies } from 'next/headers';
import Image from 'next/image';
import { getUnixTime } from 'date-fns';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import PageContainer from '@/components/layout/page-container';
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
import { Label } from '@/components/ui/label';
import { renderQuota } from '@/utils/render';
import StripePage from '../stripePage';
import TopupForm from '../topup-form';

export default async function TopupPage() {
  const _cookie = 'session=' + cookies().get('session')?.value + '==';
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/user/self`,
    {
      credentials: 'include',
      headers: {
        Cookie: _cookie
      }
    }
  );
  const { data } = await res.json();
  // console.log('topup', data);

  let topUpLink = '';
  let paymentUri = '';

  // const _cookie = 'session=' + cookies().get('session')?.value + '==';
  const res2 = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/pay/get_qrcode`,
    {
      credentials: 'include',
      headers: {
        Cookie: _cookie
      }
    }
  );
  const upLinkData = await res2.json();
  // console.log('upLinkData', upLinkData);
  if (upLinkData.data?.qr_code) {
    const base64 = `data:image/png;base64,${upLinkData.data?.qr_code}`;
    topUpLink = base64;
  }
  paymentUri = upLinkData.data?.payment_uri;

  return (
    <PageContainer scrollable>
      <div className="space-y-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        </div>
        <Label>Balance {renderQuota(data?.quota || 0)}</Label>
        <TopupForm />
        <Card>
          <CardHeader>
            <CardTitle>Pay with crypto</CardTitle>
            {/* <CardDescription></CardDescription> */}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                {topUpLink && (
                  <Image
                    src={topUpLink}
                    alt="Top Up QR Code"
                    width={200}
                    height={200}
                    unoptimized
                  />
                )}
                <p>Recharge USTD</p>
                <p>Mainnet: Polygon</p>
                <p className="break-words">
                  Deposit Address: 0x3C034A1Cf6A3eBe386b51327F5f8d9A06057821B
                </p>
              </div>
              <StripePage />
            </div>
          </CardContent>
          <CardFooter>
            <p>
              Please pay usdt from Polygon, please do not transfer tokens from
              other chains
            </p>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
