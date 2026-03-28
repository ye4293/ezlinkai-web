'use client';

import { useState, useEffect } from 'react';

interface SystemConfig {
  systemName: string;
  serverAddress: string;
  docsAddress: string;
  loading: boolean;
}

const DEFAULTS = {
  systemName: 'EZLINK AI',
  serverAddress: 'https://api.ezlinkai.com',
  docsAddress: 'http://docs.ezlinkai.com/'
};

// 模块级缓存，避免多个组件各自发起重复请求
let cachedConfig: Omit<SystemConfig, 'loading'> | null = null;
let fetchPromise: Promise<Omit<SystemConfig, 'loading'>> | null = null;

function fetchSystemConfig(): Promise<Omit<SystemConfig, 'loading'>> {
  if (cachedConfig) return Promise.resolve(cachedConfig);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/public/option')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    })
    .then((result) => {
      if (result.success && result.data) {
        const data = result.data;
        cachedConfig = {
          systemName: data.system_name || DEFAULTS.systemName,
          serverAddress: data.server_address || DEFAULTS.serverAddress,
          docsAddress: data.docs_address || DEFAULTS.docsAddress
        };
      } else {
        cachedConfig = { ...DEFAULTS };
      }
      return cachedConfig;
    })
    .catch(() => {
      cachedConfig = { ...DEFAULTS };
      return cachedConfig;
    });

  return fetchPromise;
}

export function useSystemConfig(): SystemConfig {
  const [config, setConfig] = useState<SystemConfig>(() => ({
    ...(cachedConfig || DEFAULTS),
    loading: !cachedConfig
  }));

  useEffect(() => {
    if (cachedConfig) return;

    let cancelled = false;
    fetchSystemConfig().then((result) => {
      if (!cancelled) {
        setConfig({ ...result, loading: false });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
