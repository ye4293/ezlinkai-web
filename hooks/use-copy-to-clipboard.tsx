'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string | number, label?: string) => {
    try {
      const textToCopy = String(text);
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      toast.success(`${label || '内容'}已复制到剪贴板`, {
        duration: 2000
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请重试', {
        duration: 2000
      });
    }
  };

  return { copyToClipboard, isCopied };
}
