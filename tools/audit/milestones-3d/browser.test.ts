import { describe, expect, it } from 'vitest';
import { launchOptions } from './browser.ts';

describe('launchOptions', () => {
  it('lance Firefox avec écran quand un affichage est défini', () => {
    expect(launchOptions('firefox', 'software', { DISPLAY: ':99' })).toEqual({
      args: [],
      headless: false,
    });
  });

  it('garde Firefox sans écran sans affichage ou avec un affichage vide', () => {
    expect(launchOptions('firefox', 'software', {})).toEqual({ args: [] });
    expect(launchOptions('firefox', 'software', { DISPLAY: '' })).toEqual({ args: [] });
  });

  it('ne change ni Chromium ni WebKit selon l’affichage', () => {
    expect(launchOptions('webkit', 'software', { DISPLAY: ':99' })).toEqual({ args: [] });
    const chromium = launchOptions('chromium', 'software', { DISPLAY: ':99' });
    expect(chromium.headless).toBeUndefined();
    expect(chromium.args).toContain('--use-angle=swiftshader');
    expect(launchOptions('chromium', 'default', {}).args).toEqual([]);
  });
});
