'use client';

import { serverFetch } from '@/app/lib/serverFetch';
import { ChannelType } from '@/lib/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ChannelTypesContextType {
  channelTypes: ChannelType[];
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannelTypes = async () => {
      try {
        const res = await serverFetch('/api/channel/types');
        const { data } = await res.json();
        setChannelTypes(data);
      } catch (error) {
        console.error('Failed to fetch channel types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannelTypes();
  }, []);

  return (
    <ChannelTypesContext.Provider value={{ channelTypes, loading }}>
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
