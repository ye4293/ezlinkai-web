import { searchParamsCache } from '@/lib/searchparams';
import { ListingPage } from '@/sections/bigquery/views';
import { SearchParams } from 'nuqs/parsers';
import React from 'react';

type pageProps = {
  searchParams: SearchParams;
};

export const metadata = {
  title: 'Audit'
};

export default async function Page({ searchParams }: pageProps) {
  searchParamsCache.parse(searchParams);

  return <ListingPage />;
}
