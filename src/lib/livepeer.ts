
import { createReactClient, studioProvider } from '@livepeer/react';

export const livepeerClient = createReactClient({
  provider: studioProvider({
    apiKey: process.env.LIVEPEER_API_KEY || '',
  }),
});
