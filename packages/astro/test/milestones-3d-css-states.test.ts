import { describe, expect, it } from 'vitest';
import { FILES, read, strip } from './milestones-3d-css-helpers';

describe('états du composant', () => {
  const all = FILES.map((name) => strip(read(name))).join('\n');
  const rule = (selector: string): string =>
    new RegExp(`${selector.replace(/[\\[\]().*]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(all)?.[1] ?? '';

  it('importe les feuilles du mode amélioré depuis la feuille principale', () => {
    const base = strip(read('milestones-3d.css'));
    for (const name of FILES.slice(1)) expect(base).toContain(`@import './${name}';`);
  });

  it('masque la scène sans état et ne masque jamais la liste de référence', () => {
    expect(rule('.pp-milestones__stage')).toMatch(/display:\s*none/);
    expect(all).not.toMatch(/__list[^{]*\{[^}]*display:\s*none/);
  });

  it('déduit la hauteur de la piste du nombre d’étapes, en mode défilement seulement', () => {
    expect(all).toMatch(
      /\[data-mode='scroll'\] \.pp-milestones__track\s*\{[^}]*calc\(var\(--milestones-steps, 1\) \* var\(--milestones-step\) \+ var\(--milestones-screen\)\)/,
    );
    expect(all).toContain('--milestones-step: 70svh');
    expect(all).not.toMatch(/\[data-mode='steps'\][^{]*track\s*\{/);
  });

  it('épingle la scène (sticky, 100svh) en mode défilement, pas en mouvement réduit', () => {
    const scroll = rule(".pp-milestones[data-mode='scroll'] .pp-milestones__frame");
    const frame = rule('.pp-milestones[data-state] .pp-milestones__frame');
    expect(scroll).toMatch(/position:\s*sticky/);
    expect(frame).toMatch(/block-size:\s*var\(--milestones-screen\)/);
    expect(frame).not.toContain('sticky');
  });

  it('laisse le défilement vertical au navigateur sur le canvas', () => {
    expect(rule('.pp-milestones__canvas')).toMatch(/touch-action:\s*pan-y/);
  });

  it('pose le badge intact sur une pastille claire fixe, sans filtre, opacité ni rognage', () => {
    const medal = rule('.pp-milestones__medal');
    expect(medal).toMatch(/color-scheme:\s*light/);
    expect(medal).toMatch(/background-color:\s*var\(--pp-color-bg\)/);
    expect(rule('.pp-milestones__badge')).toMatch(/object-fit:\s*contain/);
    expect(all).not.toMatch(/opacity|mix-blend-mode|mask|clip-path:(?!\s*(?:inset\(50%\)|none))/);
  });

  it('garantit des cibles minimales aux liens, étapes et boutons de navigation', () => {
    const target = /min-block-size:\s*var\(--pp-size-(?:target-min|control-height)\)/;
    for (const name of ['link', 'select', 'nav-button'])
      expect(rule(`.pp-milestones__${name}`), name).toMatch(target);
  });

  it('réserve la place du panneau : seul visibility change, jamais display', () => {
    const near = rule(".pp-milestones__panel[data-near='false']");
    expect(near).toMatch(/visibility:\s*hidden/);
    expect(near).not.toContain('display');
    expect(rule('.pp-milestones[data-state] .pp-milestones__panel')).toMatch(
      /max-block-size:\s*40svh/,
    );
  });

  it('marque l’étape active par plus que la couleur, et le prévu par un trait pointillé', () => {
    const active = rule(".pp-milestones__select[aria-current='step']");
    expect(active).toContain('border-color');
    expect(active).toContain('font-weight');
    expect(rule(".pp-milestones__item[data-status='planned']")).toMatch(/dashed/);
    expect(rule(".pp-milestones__label[data-status='planned']")).toMatch(/dashed/);
  });

  it('masque les étiquettes hors cadre ou en chevauchement par visibility', () => {
    expect(rule('.pp-milestones__label[data-hidden]')).toMatch(/visibility:\s*hidden/);
    expect(rule('.pp-milestones__labels')).toMatch(/pointer-events:\s*none/);
  });
});
