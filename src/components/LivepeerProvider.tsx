
import { LivepeerConfig } from '@livepeer/react';
import { livepeerClient } from '@/lib/livepeer';

interface LivepeerProviderProps {
  children: React.ReactNode;
}

const LivepeerProvider = ({ children }: LivepeerProviderProps) => {
  return (
    <LivepeerConfig client={livepeerClient}>
      {children}
    </LivepeerConfig>
  );
};

export default LivepeerProvider;
