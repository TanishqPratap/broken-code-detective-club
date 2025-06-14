
import { StreamVideoClient, User } from '@stream-io/video-react-sdk';

const apiKey = 'jbbw9vqpfkrx';

export const createStreamVideoClient = (user: { id: string; name?: string; image?: string }) => {
  const streamUser: User = {
    id: user.id,
    name: user.name || user.id,
    image: user.image,
  };

  return new StreamVideoClient({
    apiKey,
    user: streamUser,
    tokenProvider: async () => {
      // For production, you'd generate this token on your backend
      // For now, we'll use a simple approach
      const response = await fetch('/api/stream-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Stream token');
      }
      
      const data = await response.json();
      return data.token;
    },
  });
};
