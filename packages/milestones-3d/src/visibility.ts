// Pause hors écran et onglet masqué : aucune image n'est planifiée tant que la scène n'est pas vue.
import type { Bag } from './bag.ts';
import type { Env } from './env.ts';
import type { Loop } from './loop.ts';
import type { CanvasLike } from './raw.ts';

export function watchVisibility(canvas: CanvasLike, loop: Loop, env: Env, bag: Bag): void {
  let inView = true;
  const update = (): void => loop.setPaused(!(inView && env.pageVisible()));
  const observer = new env.IntersectionObserver((entries) => {
    const last = entries.at(-1);
    if (!last) return;
    inView = last.isIntersecting;
    update();
  });
  observer.observe(canvas);
  bag.add(() => observer.disconnect());
  bag.listen(env.document, 'visibilitychange', update);
}
