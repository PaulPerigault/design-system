// Scénarios de page : taille, thème, préférences et simulations (économie de données, appareil
// faible, navigateur sans WebGL2) posées avant tout script de la page.
import { VIEWPORTS } from './model.ts';

export interface Scenario {
  viewport?: keyof typeof VIEWPORTS;
  colorScheme?: 'light' | 'dark';
  reducedMotion?: 'reduce' | 'no-preference';
  /** Simulations posées avant tout script de la page. */
  saveData?: boolean;
  weakDevice?: boolean;
  noWebgl2?: boolean;
  /** Geste après le chargement (défaut : oui). La 3D attend un geste quand la section est à l'écran. */
  wake?: boolean;
  /** Première visite : service worker bloqué, les octets viennent du réseau et non du cache du site. */
  freshVisit?: boolean;
}

/** Simulations injectées avant le script de la page (états refusés par `canEnhance`). */
export function initScript(scenario: Scenario): string {
  const parts: string[] = [];
  if (scenario.saveData) {
    parts.push(
      "Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true});",
    );
  }
  if (scenario.weakDevice) {
    parts.push(
      "Object.defineProperty(navigator,'hardwareConcurrency',{value:2,configurable:true});",
    );
  }
  if (scenario.noWebgl2) {
    parts.push(
      "const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t==='webgl2'?null:g.call(this,t,...a);};",
    );
  }
  return parts.join('\n');
}

export function contextOptions(scenario: Scenario) {
  return {
    serviceWorkers: scenario.freshVisit ? ('block' as const) : ('allow' as const),
    viewport: VIEWPORTS[scenario.viewport ?? 'desktop'],
    colorScheme: scenario.colorScheme ?? 'light',
    reducedMotion: scenario.reducedMotion ?? 'no-preference',
  };
}
