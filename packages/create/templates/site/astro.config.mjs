import { defineConfig } from 'astro/config';

// Site statique : aucune page rendue à la demande, aucun JS envoyé par défaut.
export default defineConfig({
  output: 'static',
});
