// Badge intact (conditions d'usage AWS, ADR-0013) : l'image du réseau et la pastille du panneau ne
// sont ni filtrées ni rendues translucides, ni par leurs ancêtres.
import type { Page } from '@playwright/test';
import { HOST, row } from './model.ts';
import type { Row, Where } from './model.ts';

/** Aucun filtre, aucune opacité, aucun mélange sur les images, ni sur leurs ancêtres. */
export async function auditIntact(page: Page, where: Where): Promise<Row> {
  const report = await page.locator(`${HOST} img`).evaluateAll((images) =>
    images.map((img) => {
      let opacity = 1;
      let filtered = false;
      for (let node: Element | null = img; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        opacity *= Number(style.opacity);
        filtered ||=
          style.filter !== 'none' ||
          style.mixBlendMode !== 'normal' ||
          style.backdropFilter !== 'none';
      }
      const loaded = (img as HTMLImageElement).naturalWidth > 0;
      return { loaded, clean: opacity === 1 && !filtered };
    }),
  );
  const loaded = report.filter((entry) => entry.loaded).length;
  const dirty = report.filter((entry) => !entry.clean).length;
  const detail = `${report.length} image(s), ${loaded} chargée(s), ${dirty} filtrée(s)`;
  return row(where, 'badge intact : ni filtre ni opacité', loaded > 0 && dirty === 0, detail);
}
