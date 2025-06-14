
import React from 'react';

interface LivepeerProviderProps {
  children: React.ReactNode;
}

const LivepeerProvider = ({ children }: LivepeerProviderProps) => {
  return (
    <div>
      {children}
    </div>
  );
};

export default LivepeerProvider;
