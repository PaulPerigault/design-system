import { describe, expect, it } from 'vitest';
import { ALLOWED, installScriptProblems, run } from './check-install-scripts.mjs';

const lock = (packages) => ({ packages });

describe('check-install-scripts', () => {
  it('admet les paquets de la liste blanche et ceux sans script', () => {
    const packages = {
      'node_modules/fsevents': { version: '2.3.3', hasInstallScript: true },
      'node_modules/astro': { version: '7.4.1' },
    };
    expect(installScriptProblems(lock(packages))).toEqual([]);
  });

  it('refuse un paquet inconnu avec script, même imbriqué', () => {
    const packages = {
      'node_modules/a/node_modules/mauvais': { version: '1.0.0', hasInstallScript: true },
    };
    expect(installScriptProblems(lock(packages))).toEqual([
      "mauvais@1.0.0 : script d'installation non admis",
    ]);
  });

  it('une admission porte une raison', () => {
    for (const reason of Object.values(ALLOWED)) expect(reason.length).toBeGreaterThan(0);
  });

  it('run lit le lockfile par le lecteur injecté', () => {
    const read = () =>
      JSON.stringify(lock({ 'node_modules/x': { version: '1.0.0', hasInstallScript: true } }));
    expect(run(read)).toHaveLength(1);
  });
});
