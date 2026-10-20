/// <reference types="astro/client" />

// Les composants `.astro` sont compilés par Astro (et par Vitest via getViteConfig) ; `tsc` seul
// n'en connaît pas le type : déclaration minimale pour `tsc --noEmit -p packages/astro`.
declare module '*.astro' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
  const component: AstroComponentFactory;
  export default component;
}
