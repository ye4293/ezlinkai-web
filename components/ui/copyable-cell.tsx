'use client';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CopyableCellProps {
  value: string | number;
  children: ReactNode;
  className?: string;
  label?: string;
}

export function CopyableCell({
  value,
  children,
  className,
  label
}: CopyableCellProps) {
  const { copyToClipboard } = useCopyToClipboard();

  const handleClick = () => {
    copyToClipboard(value, label);
  };

  return (
    <div
      className={cn(
        '-m-1 cursor-pointer rounded p-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
        className
      )}
      onClick={handleClick}
      title={`点击复制${label || '内容'}`}
    >
      {children}
    </div>
  );
}
