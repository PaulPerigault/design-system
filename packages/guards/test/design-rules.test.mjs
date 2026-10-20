import { describe, expect, it } from 'vitest';
import { analyze, RULE_IDS } from '../src/design/rules.mjs';

const ALL = new Set(RULE_IDS);
const rulesOf = (file, text) => analyze(file, text, ALL).map((p) => p.rule);
const css = (text) => rulesOf('a.css', text);
const markup = (text) => rulesOf('a.astro', text);

describe('gradient', () => {
  it('refuse les fonctions et les classes', () => {
    expect(css('a { background: repeating-linear-gradient(red, blue); }')).toContain('gradient');
    expect(css('a { background-image: conic-gradient(#000, #111); }')).toContain('gradient');
    expect(markup('<p class="bg-gradient-to-r bg-radial bg-conic-180">')).toEqual(
      Array(3).fill('gradient'),
    );
  });
  it('permet un fond plein', () => expect(css('a { background: var(--x); }')).toEqual([]));
});

describe('shadow', () => {
  it('refuse les ombres et drop-shadow', () => {
    expect(css('a { box-shadow: 0 0 var(--pp-space-1) var(--pp-color-fg); }')).toEqual(['shadow']);
    expect(css('a { filter: drop-shadow(var(--x)); }')).toEqual(['shadow']);
    expect(markup('<p class="shadow-md md:drop-shadow-lg">')).toEqual(['shadow', 'shadow']);
  });
  it('permet none, la transition citée et shadow-none', () => {
    expect(css('a { box-shadow: none; text-shadow: NONE; }')).toEqual([]);
    expect(css('a { transition: box-shadow var(--pp-duration-fast); }')).toEqual([]);
    expect(markup('<p class="shadow-none">')).toEqual([]);
  });
});

describe('blur', () => {
  it('refuse backdrop-filter, blur( et les classes', () => {
    expect(css('a { backdrop-filter: saturate(1); }')).toEqual(['blur']);
    expect(css('a { filter: blur(2px); }')).toContain('blur');
    expect(markup('<p class="blur-sm backdrop-blur">')).toEqual(['blur', 'blur']);
  });
  it('permet backdrop-filter: none et will-change', () => {
    expect(css('a { backdrop-filter: none; will-change: backdrop-filter; }')).toEqual([]);
  });
});

describe('emoji', () => {
  it('refuse un emoji, y compris en Markdown', () => {
    expect(rulesOf('a.md', 'Bravo 🎉')).toEqual(['emoji']);
    expect(rulesOf('a.md', 'Attention ⚠️ ici')).toEqual(['emoji']);
  });
  it('permet ©, ®, ™, ↔, → et un emoji en commentaire CSS', () => {
    expect(rulesOf('a.md', '© ® ™ ↔ →')).toEqual([]);
    expect(css('/* 🎉 */ a { color: var(--pp-color-fg); }')).toEqual([]);
  });
});

describe('spaced-caps', () => {
  it('refuse uppercase avec interlettrage positif (CSS et classes)', () => {
    expect(css('a { text-transform: uppercase; letter-spacing: 0.1em; }')).toEqual(['spaced-caps']);
    expect(markup('<p class="uppercase tracking-widest">')).toEqual(['spaced-caps']);
    expect(markup('<p class="uppercase tracking-[0.2em]">')).toContain('spaced-caps');
  });
  it('permet un interlettrage négatif ou sans uppercase', () => {
    expect(css('a { text-transform: uppercase; letter-spacing: -0.01em; }')).toEqual([]);
    expect(css('a { letter-spacing: 0.1em; } b { text-transform: uppercase; }')).toEqual([]);
    expect(markup('<p class="tracking-wide"><b class="uppercase">')).toEqual([]);
  });
});

describe('tailwind-palette', () => {
  it('refuse les teintes par défaut', () => {
    expect(markup('<p class="bg-slate-100 hover:text-rose-950/50">')).toEqual([
      'tailwind-palette',
      'tailwind-palette',
    ]);
    expect(css('a { color: var(--color-emerald-500); }')).toContain('tailwind-palette');
  });
  it('permet les tokens', () => expect(markup('<p class="bg-surface text-fg">')).toEqual([]));
});

describe('arbitrary-value', () => {
  it('refuse les valeurs arbitraires', () => {
    expect(markup('<p class="p-[13px] bg-[#fff] w-[calc(100%-2px)]">')).toEqual(
      Array(3).fill('arbitrary-value'),
    );
  });
  it('permet les sélecteurs d attribut CSS', () => {
    expect(css(".x[data-space='m'] { margin: 0; }")).toEqual([]);
    expect(markup('<p class="p-4" data-x="[a]">')).toEqual([]);
  });
});

describe('color-literal', () => {
  it('refuse hex, fonctions et couleurs nommées', () => {
    expect(css('a { color: #fff; }')).toEqual(['color-literal']);
    expect(css('a { color: #ffffff80; }')).toEqual(['color-literal']);
    expect(css('a { color: oklch(0.5 0.1 200); }')).toEqual(['color-literal']);
    expect(css('a { border: 1px solid red; }')).toEqual(['color-literal']);
    expect(markup('<style>a { fill: rgb(0 0 0); }</style>')).toEqual(['color-literal']);
  });
  it('permet var, mots-clés, sélecteurs #id et url(#id)', () => {
    expect(css('#main { color: var(--pp-color-fg); }')).toEqual([]);
    expect(
      css('a { color: currentColor; background: transparent; border-color: inherit; }'),
    ).toEqual([]);
    expect(css('a { fill: url(#abc); }')).toEqual([]);
    expect(css('#main {\n  margin: 0;\n}')).toEqual([]);
  });
});

describe('retro-effect', () => {
  it('refuse les animations et keyframes rétro', () => {
    expect(css('@keyframes glitch { to { opacity: 1; } }')).toEqual(['retro-effect']);
    expect(css('a { animation: typewriter 2s steps(10); }')).toEqual(['retro-effect']);
    expect(css('a { animation-name: blink-caret; }')).toEqual(['retro-effect']);
  });
  it('permet une animation neutre', () =>
    expect(css('@keyframes fade { to { opacity: 1; } } a { animation: fade 1s; }')).toEqual([]));
});
