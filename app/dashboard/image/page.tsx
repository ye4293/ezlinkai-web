import { searchParamsCache } from '@/lib/searchparams';
import { ImageListingPage } from '@/sections/image/views';
import { SearchParams } from 'nuqs/parsers';

type pageProps = {
  searchParams: SearchParams;
};

export const metadata = {
  title: 'Dashboard : Image'
};

export default async function Page({ searchParams }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  return <ImageListingPage />;
}
