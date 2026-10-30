import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://design.paulperigault.dev',
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    // Les paquets du dépôt sont lus en source ; la condition est absente des paquets publiés.
    resolve: { conditions: ['@paulperigault/source'] },
    ssr: { resolve: { conditions: ['@paulperigault/source'] } },
    build: { assetsInlineLimit: 0 },
  },
});
