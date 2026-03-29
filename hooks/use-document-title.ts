'use client';

import { useEffect } from 'react';
import { useSystemConfig } from '@/hooks/use-system-config';

/**
 * 动态设置浏览器标签页标题。
 * - 传入 prefix 时显示 "prefix - systemName"
 * - 不传 prefix 时仅显示 systemName
 */
export function useDocumentTitle(prefix?: string) {
  const { systemName, loading } = useSystemConfig();

  useEffect(() => {
    if (loading) return;
    document.title = prefix ? `${prefix} - ${systemName}` : systemName;
  }, [systemName, loading, prefix]);
}
