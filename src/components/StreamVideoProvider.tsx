
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { useAuth } from '@/hooks/useAuth';
import { createStreamVideoClient } from '@/lib/stream';

interface StreamVideoContextType {
  client: StreamVideoClient | null;
  isLoading: boolean;
}

const StreamVideoContext = createContext<StreamVideoContextType>({
  client: null,
  isLoading: true,
});

export const useStreamVideo = () => {
  const context = useContext(StreamVideoContext);
  if (!context) {
    throw new Error('useStreamVideo must be used within StreamVideoProvider');
  }
  return context;
};

interface StreamVideoProviderProps {
  children: React.ReactNode;
}

export const StreamVideoProvider: React.FC<StreamVideoProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setClient(null);
      setIsLoading(false);
      return;
    }

    const initClient = async () => {
      try {
        const videoClient = createStreamVideoClient({
          id: user.id,
          name: user.user_metadata?.display_name || user.email,
          image: user.user_metadata?.avatar_url,
        });
        
        setClient(videoClient);
      } catch (error) {
        console.error('Failed to initialize Stream Video client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [user]);

  return (
    <StreamVideoContext.Provider value={{ client, isLoading }}>
      {client ? (
        <StreamVideo client={client}>
          {children}
        </StreamVideo>
      ) : (
        children
      )}
    </StreamVideoContext.Provider>
  );
};
