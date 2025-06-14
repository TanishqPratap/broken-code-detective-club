
import { createReactClient, studioProvider } from '@livepeer/react';

const client = createReactClient({
  provider: studioProvider({
    apiKey: process.env.REACT_APP_LIVEPEER_API_KEY || '',
  }),
});

export { client as livepeerClient };
