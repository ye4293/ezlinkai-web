'use client';

import { CHANNEL_OPTIONS } from '@/constants';
import React, { createContext, useContext, useEffect, useState } from 'react';

type ChannelType = {
  key: number;
  text: string;
  value: number;
  color: string;
};

interface ChannelTypesContextType {
  channelTypes: ChannelType[];
}

const ChannelTypesContext = createContext<ChannelTypesContextType | undefined>(
  undefined
);

export const ChannelTypesProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/channel/types', {
          credentials: 'include'
        });
        const { data } = await res.json();
        setChannelTypes(data || []);
      } catch (error) {
        // 如果API失败，使用本地常量作为fallback
        setChannelTypes(CHANNEL_OPTIONS);
      }
    };
    fetchTypes();
  }, []);

  return (
    <ChannelTypesContext.Provider value={{ channelTypes }}>
      {children}
    </ChannelTypesContext.Provider>
  );
};

export const useChannelTypes = () => {
  const context = useContext(ChannelTypesContext);
  if (context === undefined) {
    throw new Error(
      'useChannelTypes must be used within a ChannelTypesProvider'
    );
  }
  return context;
};
