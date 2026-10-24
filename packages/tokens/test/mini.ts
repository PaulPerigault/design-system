export const oklch = (l: number, c: number, h: number) => ({
  colorSpace: 'oklch',
  components: [l, c, h],
});
export const dim = (value: number, unit: string) => ({ $value: { value, unit } });
export const theme = (bg: object, ok: object) => ({
  color: { $type: 'color', bg: { $value: bg }, status: { ok: { $value: ok } } },
});
const MINI: Record<string, unknown> = {
  'resolver.json': {
    sets: { base: { sources: ['base.json'] } },
    modifiers: { theme: { contexts: { light: ['light.json'], dark: [{ $ref: 'dark.json' }] } } },
  },
  'base.json': {
    space: { $type: 'dimension', m: dim(1.5, 'rem') },
    font: { size: { $type: 'dimension', '-1': dim(0.9, 'rem') } },
    duration: { $type: 'duration', base: dim(160, 'ms') },
  },
  'light.json': theme(oklch(1, 0, 0), oklch(0.5, 0.1, 155)),
  'dark.json': theme(oklch(0, 0, 0), oklch(0.8, 0.1, 155)),
};
export const readMini = (name: string) => JSON.stringify(MINI[name] ?? {});
export const io = (target: Record<string, string>, written: Record<string, string> = {}) => ({
  readText: readMini,
  readTarget: (name: string) => target[name],
  writeTarget: (name: string, text: string) => (written[name] = text),
});
