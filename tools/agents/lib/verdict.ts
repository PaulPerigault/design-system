// Verdict d'une revue : le relecteur doit écrire APPROUVÉ ou CHANGEMENTS REQUIS, mais le flux peut
// précéder le verdict d'une phrase (relevé avec gpt-5.6-terra, 2026-10-20). Prudence : la moindre
// mention de CHANGEMENTS REQUIS l'emporte ; sans verdict lisible, la revue est « illisible ».

const CHANGES = /CHANGEMENTS\s+REQUIS/i;
const APPROVED = /\bAPPROUV[ÉE](?!\p{L})/iu;

export type Verdict = 'approved' | 'changes' | 'unreadable';

/** `text` : compte rendu final du relecteur. */
export function verdictOf(text: string): Verdict {
  if (CHANGES.test(text)) return 'changes';
  return APPROVED.test(text) ? 'approved' : 'unreadable';
}
