import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';
import {
  install,
  onInvoke,
  onLightDismiss,
  runCommand,
  type DialogLike,
} from '../src/behaviors/invokers';

const BOX = { left: 100, right: 300, top: 100, bottom: 300 };

function fakeDialog(open = false, closedby: string | null = 'any'): DialogLike & { open: boolean } {
  const dialog = {
    open,
    showModal: vi.fn(() => void (dialog.open = true)),
    close: vi.fn(() => void (dialog.open = false)),
    getAttribute: (name: string) => (name === 'closedby' ? closedby : null),
    getBoundingClientRect: () => BOX,
  };
  return dialog;
}

const page = () =>
  parseHTML(`<button commandfor="d" command="show-modal"><span>Ouvrir</span></button>
<button commandfor="d" command="close">Fermer</button><button commandfor="d">Sans commande</button>`)
    .document;

describe('runCommand', () => {
  it('show-modal ouvre une seule fois, close ferme, request-close retombe sur close', () => {
    const dialog = fakeDialog();
    expect(runCommand(dialog, 'Show-Modal')).toBe(true); // casse ignorée, comme le natif
    runCommand(dialog, 'show-modal');
    expect(dialog.showModal).toHaveBeenCalledTimes(1);
    runCommand(dialog, 'request-close');
    expect(dialog.close).toHaveBeenCalledTimes(1);
    expect(runCommand(dialog, 'close')).toBe(true);
    expect(dialog.close).toHaveBeenCalledTimes(1);
  });

  it('commande inconnue ou absente : rien', () => {
    const dialog = fakeDialog();
    expect(runCommand(dialog, 'toggle-popover')).toBe(false);
    expect(runCommand(dialog, null)).toBe(false);
    expect(dialog.showModal).not.toHaveBeenCalled();
  });
});

describe('onInvoke', () => {
  it('clic sur un enfant du bouton : commande jouée sur le dialogue visé', () => {
    const doc = page();
    const dialog = fakeDialog();
    const find = vi.fn(() => dialog);
    const opener = doc.querySelector('button');
    const focus = vi.spyOn(opener as HTMLButtonElement, 'focus');
    expect(onInvoke(doc.querySelector('span'), find)).toBe(true);
    expect(focus).toHaveBeenCalled();
    expect(find).toHaveBeenCalledWith('d');
    expect(dialog.open).toBe(true);
    onInvoke(doc.querySelectorAll('button')[1] ?? null, find);
    expect(dialog.open).toBe(false);
  });

  it('cible absente, non dialogue, ou bouton sans command : rien', () => {
    const doc = page();
    expect(onInvoke(doc.querySelector('span'), () => null)).toBe(false);
    expect(onInvoke(doc.querySelector('span'), () => doc.body)).toBe(false);
    expect(onInvoke(doc.querySelectorAll('button')[2] ?? null, () => fakeDialog())).toBe(false);
    expect(onInvoke(null, () => fakeDialog())).toBe(false);
  });
});

describe('onLightDismiss', () => {
  const at = (target: unknown, x: number, y: number) => ({ target, x, y });

  it('ferme un dialogue closedby="any" quand appui et clic visent le fond', () => {
    const dialog = fakeDialog(true);
    expect(onLightDismiss(at(dialog, 200, 200), at(dialog, 200, 200))).toBe(false);
    expect(dialog.open).toBe(true);
    expect(onLightDismiss(at(dialog, 20, 200), at(dialog, 20, 200))).toBe(true);
    expect(dialog.open).toBe(false);
  });

  it('un glisser commencé dans la boîte ne ferme pas', () => {
    const dialog = fakeDialog(true);
    expect(onLightDismiss(at(dialog, 20, 200), at(dialog, 200, 200))).toBe(false);
    expect(onLightDismiss(at(dialog, 20, 200), null)).toBe(false);
    expect(dialog.open).toBe(true);
  });

  it('ignore les dialogues fermés ou sans closedby="any"', () => {
    const closed = fakeDialog(false);
    expect(onLightDismiss(at(closed, 20, 20), at(closed, 20, 20))).toBe(false);
    const strict = fakeDialog(true, 'closerequest');
    expect(onLightDismiss(at(strict, 20, 20), at(strict, 20, 20))).toBe(false);
    expect(strict.open).toBe(true);
  });
});

describe('install', () => {
  it('n’installe que les replis manquants', () => {
    const doc = page();
    const spy = vi.spyOn(doc, 'addEventListener');
    expect(install(doc, { invokers: true, closedBy: true })).toEqual({
      invokers: false,
      closedBy: false,
    });
    expect(spy).not.toHaveBeenCalled();
    expect(install(doc, { invokers: false, closedBy: true })).toEqual({
      invokers: true,
      closedBy: false,
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
