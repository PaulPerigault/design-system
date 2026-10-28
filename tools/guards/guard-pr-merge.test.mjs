import { describe, expect, it } from 'vitest';
import { decide, mergeRefusal, mergeSegments, targetOf } from './guard-pr-merge.mjs';

const PRS = {
  3: { base: 'main', head: 'feat/y' },
  4: { base: 'develop', head: 'feat/z' },
  5: { base: 'feat/x', head: 'feat/w' },
  6: { base: 'main', head: 'release-please--branches--main' },
};
const readBase = ({ pr }) => PRS[pr] ?? null;

describe('mergeSegments et targetOf', () => {
  it('ne voit une fusion que dans une commande gh … pr merge', () => {
    expect(mergeSegments('git log && gh pr view 3')).toEqual([]);
    expect(mergeSegments('git commit -m x; gh pr merge 3 --squash')).toHaveLength(1);
  });

  it.each([
    ['gh pr merge 3 --squash', { pr: '3', repo: null }],
    ['gh pr merge --squash 3', { pr: '3', repo: null }],
    ['gh pr merge 3 --repo o/r', { pr: '3', repo: 'o/r' }],
    ['gh -R o/r pr merge 3', { pr: '3', repo: 'o/r' }],
    ['gh pr merge https://github.com/o/r/pull/4', { pr: '4', repo: 'o/r' }],
  ])('%s vise %o', (command, target) => {
    expect(targetOf(mergeSegments(command)[0])).toEqual(target);
  });
});

describe('mergeRefusal', () => {
  it('admet une PR vers main', () => {
    expect(mergeRefusal('gh pr merge 3 --squash --delete-branch', readBase)).toBeNull();
  });

  it.each([
    ['gh pr merge 4 --squash', /« develop »/],
    ['gh pr merge 5', /« feat\/x »/],
    ['gh pr merge 6 --squash', /PR de release/],
    ['gh pr merge 99', /illisible/],
    ['gh pr merge --squash', /numéro/],
    ['gh pr merge 3 && gh pr merge 4', /#4/],
    ['bash -c "gh pr merge 4"', /#4/],
    ['/opt/homebrew/bin/gh pr merge 4', /#4/],
  ])('refuse %s', (command, reason) => {
    expect(mergeRefusal(command, readBase)).toMatch(reason);
  });

  it('ignore les commandes qui ne fusionnent pas', () => {
    expect(mergeRefusal('gh pr create --base main', readBase)).toBeNull();
  });
});

describe('decide', () => {
  it('lit la commande de l’événement de hook', () => {
    const event = JSON.stringify({ tool_input: { command: 'gh pr merge 4' } });
    expect(decide(event, readBase)).toMatch(/develop/);
  });

  it('refuse un événement illisible', () => {
    expect(decide('nope', readBase)).toMatch(/illisible/);
  });
});
