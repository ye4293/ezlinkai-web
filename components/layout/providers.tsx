'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { DefaultTitle } from './default-title';
export default function Providers({
  session,
  children
}: {
  session: SessionProviderProps['session'];
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SessionProvider session={session}>
          <DefaultTitle />
          <LocaleProvider>{children}</LocaleProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}
