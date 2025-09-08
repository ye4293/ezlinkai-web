'use client';

import { Channel } from '@/lib/types';
import React, { createContext, useContext } from 'react';

interface ChannelTypesContextType {
  channelTypes: Channel[];
}

const ChannelTypesContext = createContext<ChannelTypesContextType | undefined>(
  undefined
);

export const ChannelTypesProvider = ({
  children,
  channelTypes = []
}: {
  children: React.ReactNode;
  channelTypes?: Channel[];
}) => {
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
