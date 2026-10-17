// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Cantarell',
      cssVariable: '--font-cantarell',
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/cantarell.woff2'],
            weight: '100 800',
            style: 'normal'
          }
        ]
      }
    }
  ],
  integrations: [mdx()],
  adapter: node({
    mode: 'standalone'
  })
});
