import Providers from '@/components/layout/providers';
// import { Toaster } from '@/components/ui/toaster';
import { Toaster } from 'sonner';
import '@uploadthing/react/styles.css';
import type { Metadata } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { Inter } from 'next/font/google';
import './globals.css';
import { auth } from '@/auth';

const inter = Inter({ subsets: ['latin'] });

async function fetchSystemName(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    if (!baseUrl) return '';
    const res = await fetch(`${baseUrl}/api/status`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.data?.system_name || '';
  } catch {
    return '';
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const systemName = await fetchSystemName();
  return {
    title: systemName || undefined,
    description: systemName
      ? `${systemName} - Unified AI Model API Gateway`
      : undefined
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={`${inter.className}`} suppressHydrationWarning={true}>
        <NextTopLoader showSpinner={false} />
        <Providers session={session}>
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
