import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import Dialog from '../src/feedback/Dialog.astro';
import { renderDom } from './render';

const base = { id: 'confirm', title: 'Supprimer le brouillon', closeLabel: 'Fermer' };

const dialogOf = (document: Document): HTMLDialogElement => {
  const element = document.querySelector('dialog');
  if (!element) throw new Error('dialog absent');
  return element as HTMLDialogElement;
};

// `renderDom` ne transmet que le slot par défaut : le slot nommé passe par la Container API.
const renderWithActions = async (actions: string): Promise<Document> => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Dialog, {
    props: base,
    slots: { default: '<p>Corps</p>', actions },
  });
  return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
};

describe('Dialog (rendu)', () => {
  it('rend un <dialog> natif fermé, sans rôle ni aria-modal ajoutés', async () => {
    const dialog = dialogOf(await renderDom(Dialog, { props: base }));
    expect(dialog.id).toBe('confirm');
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(dialog.hasAttribute('role')).toBe(false);
    expect(dialog.hasAttribute('aria-modal')).toBe(false);
  });

  it('nomme la boîte par son titre <h2> (aria-labelledby dérivé de `id`)', async () => {
    const document = await renderDom(Dialog, { props: { ...base, id: 'aide' } });
    const dialog = dialogOf(document);
    const heading = dialog.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Supprimer le brouillon');
    expect(dialog.getAttribute('aria-labelledby')).toBe('aide-title');
    expect(document.getElementById('aide-title')).toBe(heading);
  });

  it('ferme par clic hors de la boîte (closedby="any")', async () => {
    expect(dialogOf(await renderDom(Dialog, { props: base })).getAttribute('closedby')).toBe('any');
  });

  it('ferme par un bouton nommé `closeLabel` dans un form method="dialog"', async () => {
    const dialog = dialogOf(await renderDom(Dialog, { props: { ...base, closeLabel: 'Close' } }));
    const form = dialog.querySelector('form');
    const button = form?.querySelector('button');
    expect(form?.getAttribute('method')).toBe('dialog');
    expect(button?.getAttribute('type')).toBe('submit');
    expect(button?.textContent?.trim()).toBe('Close');
  });

  it('n’a aucun texte en dur hors des props et des slots', async () => {
    const document = await renderDom(Dialog, { props: base });
    const squash = (value: string): string => value.replace(/\s+/g, '');
    expect(squash(document.body.textContent ?? '')).toBe(squash(base.title + base.closeLabel));
  });

  it('rend le slot par défaut dans le corps', async () => {
    const document = await renderDom(Dialog, { props: base, slot: '<p>Action définitive.</p>' });
    expect(document.querySelector('.pp-dialog__body p')?.textContent).toBe('Action définitive.');
  });

  it('n’ajoute pas de zone d’actions sans slot `actions`', async () => {
    const document = await renderDom(Dialog, { props: base, slot: '<p>x</p>' });
    expect(document.querySelector('.pp-dialog__actions')).toBeNull();
  });

  it('rend le slot `actions` dans sa zone', async () => {
    const document = await renderWithActions('<button type="button">Supprimer</button>');
    const actions = document.querySelector('.pp-dialog__actions');
    expect(actions?.querySelector('button')?.textContent).toBe('Supprimer');
  });

  it('ne pose aucun attribut style, ni autofocus ni script', async () => {
    const document = await renderWithActions('<button type="button">Ok</button>');
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
    expect(document.querySelectorAll('[autofocus], script')).toHaveLength(0);
  });
});

describe('Dialog (source CSS)', () => {
  const source = readFileSync(new URL('../src/feedback/Dialog.astro', import.meta.url), 'utf8');
  const style = source.slice(source.indexOf('<style>'));

  it('assombrit l’arrière-plan à 60 % de --pp-color-fg, sans flou', () => {
    expect(style).toMatch(
      /::backdrop\s*\{\s*background-color:\s*color-mix\(in oklab, var\(--pp-color-fg\) 60%, transparent\);/,
    );
    expect(style).not.toContain('backdrop-filter');
    expect(style).not.toContain('blur');
  });

  it('anime l’entrée par @starting-style sous no-preference seulement', () => {
    const motion = style.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(motion).toBeGreaterThan(-1);
    expect(style.indexOf('@starting-style')).toBeGreaterThan(motion);
    expect(style.indexOf('transition')).toBeGreaterThan(motion);
  });

  it('vise le slot via :global( et recentre la modale par marges logiques', () => {
    expect(style).toContain('.pp-dialog__body > :global(*)');
    expect(style).toMatch(/\.pp-dialog:modal\s*\{\s*margin-block: auto;\s*margin-inline: auto;/);
  });

  it('ne redéfinit pas le focus, sans ombre ni propriété physique', () => {
    expect(style).not.toMatch(/:focus|outline|box-shadow/);
    expect(style).not.toMatch(/\b(?:margin|padding)(?:-(?:top|bottom|left|right))?:/);
  });
});
