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
    expect(runCommand(dialog, 'show-modal')).toBe(true);
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
    expect(onInvoke(doc.querySelector('span'), find)).toBe(true);
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
  it('ferme un dialogue closedby="any" ouvert sur un clic hors de sa boîte', () => {
    const dialog = fakeDialog(true);
    expect(onLightDismiss(dialog, 200, 200)).toBe(false);
    expect(dialog.open).toBe(true);
    expect(onLightDismiss(dialog, 20, 200)).toBe(true);
    expect(dialog.open).toBe(false);
  });

  it('ignore les dialogues fermés ou sans closedby="any"', () => {
    expect(onLightDismiss(fakeDialog(false), 20, 20)).toBe(false);
    const strict = fakeDialog(true, 'closerequest');
    expect(onLightDismiss(strict, 20, 20)).toBe(false);
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
