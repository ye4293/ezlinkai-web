'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Options } from 'nuqs';
import { useTransition, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface DataTableSearchProps {
  searchKey: string;
  searchQuery: string;
  setSearchQuery: (
    value: string | ((old: string) => string | null) | null,
    options?: Options<any> | undefined
  ) => Promise<URLSearchParams>;
  setPage: <Shallow>(
    value: number | ((old: number) => number | null) | null,
    options?: Options<Shallow> | undefined
  ) => Promise<URLSearchParams>;
}

export function DataTableSearch({
  searchKey,
  searchQuery,
  setSearchQuery,
  setPage
}: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();
  const [localSearchValue, setLocalSearchValue] = useState(searchQuery ?? '');

  // 同步外部搜索值到本地状态（例如重置时）
  useEffect(() => {
    setLocalSearchValue(searchQuery ?? '');
  }, [searchQuery]);

  const handleSearch = () => {
    setSearchQuery(localSearchValue, { startTransition });
    setPage(1); // Reset page to 1 when search changes
  };

  const handleClear = () => {
    setLocalSearchValue('');
    setSearchQuery('', { startTransition });
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex w-full items-center space-x-2 md:max-w-sm">
      <div className="relative flex-1">
        <Input
          placeholder={`Search ${searchKey}...`}
          value={localSearchValue}
          onChange={(e) => setLocalSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className={cn('pr-8', isLoading && 'animate-pulse')}
        />
        {localSearchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Button
        onClick={handleSearch}
        size="sm"
        variant="outline"
        disabled={isLoading}
        className="flex-shrink-0"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
