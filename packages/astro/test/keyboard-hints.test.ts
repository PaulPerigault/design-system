import { describe, expect, it } from 'vitest';
import Input from '../src/forms/Input.astro';
import Textarea from '../src/forms/Textarea.astro';
import { renderDom } from './render';

const BASE = { id: 'champ', name: 'champ' };

const attribute = async (component: typeof Input, props: Record<string, unknown>, name: string) => {
  const dom = await renderDom(component, { props: { ...BASE, ...props } });
  return dom.querySelector('input, textarea')?.getAttribute(name) ?? null;
};

describe('claviers virtuels (gap n° 8)', () => {
  it('Input : enterkeyhint, inputmode et autocomplete transmis', async () => {
    expect(await attribute(Input, { enterkeyhint: 'next' }, 'enterkeyhint')).toBe('next');
    expect(await attribute(Input, { inputmode: 'numeric' }, 'inputmode')).toBe('numeric');
    expect(await attribute(Input, { autocomplete: 'email' }, 'autocomplete')).toBe('email');
  });

  it('Textarea : enterkeyhint transmis', async () => {
    expect(await attribute(Textarea, { enterkeyhint: 'send' }, 'enterkeyhint')).toBe('send');
  });

  it('absents par défaut : le navigateur choisit', async () => {
    expect(await attribute(Input, {}, 'enterkeyhint')).toBeNull();
    expect(await attribute(Textarea, {}, 'enterkeyhint')).toBeNull();
  });
});
