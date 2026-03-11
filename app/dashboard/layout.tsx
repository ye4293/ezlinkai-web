import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full max-w-[100vw] overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Header />
        {children}
      </main>
    </div>
  );
}
