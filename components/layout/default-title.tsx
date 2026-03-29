'use client';

import { useDocumentTitle } from '@/hooks/use-document-title';

export function DefaultTitle() {
  useDocumentTitle();
  return null;
}
