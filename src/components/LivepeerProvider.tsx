
import React from 'react';
import { LivepeerConfig, createReactClient, studioProvider } from '@livepeer/react';

interface LivepeerProviderProps {
  children: React.ReactNode;
}

const LivepeerProvider = ({ children }: LivepeerProviderProps) => {
  const client = createReactClient({
    provider: studioProvider({ apiKey: 'dummy-key' }), // We'll use edge functions for actual API calls
  });

  return (
    <LivepeerConfig client={client}>
      {children}
    </LivepeerConfig>
  );
};

export default LivepeerProvider;
