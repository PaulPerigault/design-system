import { describe, expect, it } from 'vitest';
import { listen, listenAll } from './drive.mjs';
import { evaluateCommon, evaluateComponents, verdict } from './evaluate.mjs';
import { COMMON, COMPONENTS, PAGES } from './expectations.mjs';
import { renderReport } from './report.mjs';

const fakeVoiceOver = (log, { failAt } = {}) => {
  const events = [];
  return {
    events,
    start: async () => events.push('start'),
    next: async () => {
      if (events.filter((event) => event === 'next').length === failAt)
        throw new Error('VoiceOver a quitté');
      events.push('next');
    },
    spokenPhraseLog: async () => log,
    stop: async () => events.push('stop'),
  };
};
const tools = (voiceOver, steps = 3) => ({
  voiceOver,
  open: async () => {},
  wait: async () => {},
  steps,
});

describe('listen', () => {
  it('démarre, avance du nombre de pas demandé, rend le texte et arrête VoiceOver', async () => {
    const vo = fakeVoiceOver(['a', 'b']);
    expect(await listen('http://x/', tools(vo))).toEqual(['a', 'b']);
    expect(vo.events).toEqual(['start', 'next', 'next', 'next', 'stop']);
  });
  it('arrête VoiceOver même si un pas échoue', async () => {
    const vo = fakeVoiceOver([], { failAt: 1 });
    await expect(listen('http://x/', tools(vo))).rejects.toThrow('quitté');
    expect(vo.events.at(-1)).toBe('stop');
  });
  it('une page en erreur donne une liste vide et est signalée', async () => {
    const errors = [];
    const vo = fakeVoiceOver([], { failAt: 0 });
    const spoken = await listenAll('http://x', ['/a/'], tools(vo), (page) => errors.push(page));
    expect(spoken.get('/a/')).toEqual([]);
    expect(errors).toEqual(['/a/']);
  });
});

describe('évaluation', () => {
  it('distingue conforme, écart et non testé', () => {
    const point = { pattern: /dialogue/i };
    expect(verdict(['Dialogue : Fermer'], point)).toBe('conforme');
    expect(verdict(['bouton'], point)).toBe('écart');
    expect(verdict([], point)).toBe('non testé');
  });
  it('le lien d’évitement doit être le premier arrêt', () => {
    const evitement = COMMON.find((point) => point.id === 'evitement');
    expect(verdict(['Aller au contenu', 'titre'], evitement)).toBe('conforme');
    expect(verdict(['titre', 'Aller au contenu'], evitement)).toBe('écart');
  });
  it('évalue les points communs et les composants', () => {
    const common = evaluateCommon(['navigation', 'titre niveau 1'], COMMON);
    expect(common.map((point) => point.result)).toContain('conforme');
    const results = evaluateComponents(
      new Map([['/components/dialog/', ['dialogue']]]),
      COMPONENTS,
    );
    expect(results.find((r) => r.component === 'Dialog').result).toBe('conforme');
    expect(results.find((r) => r.component === 'Switch').result).toBe('non testé');
  });
});

describe('rapport et attentes', () => {
  it('suit le format de la section 5 et liste les écarts', () => {
    const text = renderReport({
      date: '2026-11-02',
      environment: 'macOS 26, Safari 26',
      commit: 'abc1234',
      components: [
        { component: 'Dialog', element: 'Annonce', expected: 'Nom | rôle', result: 'écart' },
      ],
      common: [{ page: '/', points: [{ label: 'Titres annoncés', result: 'conforme' }] }],
    });
    expect(text).toContain('# Résultats VoiceOver : 2026-11-02');
    expect(text).toContain('| Dialog (Annonce) | VO macOS | Nom \\| rôle | écart | oui |');
    expect(text).toContain('Dialog : Annonce (écart à écouter)');
  });
  it('couvre les pages et les composants de la checklist', () => {
    expect(PAGES).toContain('/components/dialog/');
    expect(COMPONENTS.map((c) => c.id)).toEqual(['Dialog', 'Accordion', 'Select', 'Switch']);
    expect(COMPONENTS.every((c) => PAGES.includes(c.page))).toBe(true);
  });
});
