
import React from 'react';
import { LivepeerConfig, createReactClient, studioProvider } from '@livepeer/react';

interface LivepeerProviderProps {
  children: React.ReactNode;
}

const LivepeerProvider = ({ children }: LivepeerProviderProps) => {
  // For now, we'll use a simple wrapper without the Livepeer client
  // since we're handling API calls through our edge function
  return <>{children}</>;
};

export default LivepeerProvider;
