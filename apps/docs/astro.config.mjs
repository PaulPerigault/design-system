import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ds.paulperigault.dev',
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
