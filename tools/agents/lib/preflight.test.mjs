import { describe, expect, it } from 'vitest';
import { baselineCommands, failingBaseline } from './preflight.ts';

const task = (files, acceptance) => ({ files, acceptance });

describe('contrôle préalable (D-015)', () => {
  it('garde les commandes distinctes qui ne citent aucun fichier de tâche', () => {
    const tasks = [
      task(
        ['packages/astro/test/Alert.test.ts'],
        ['npx vitest run packages/astro/test/Alert.test.ts', 'npx tsc --noEmit -p packages/astro'],
      ),
      task(
        ['packages/astro/test/Table.test.ts'],
        ['npx tsc --noEmit -p packages/astro', 'npm -w @paulperigault/docs run check'],
      ),
    ];
    expect(baselineCommands(tasks)).toEqual([
      'npx tsc --noEmit -p packages/astro',
      'npm -w @paulperigault/docs run check',
    ]);
  });

  it('ignore une commande qui vise un dossier que les tâches vont créer', () => {
    const tasks = [
      task(
        ['packages/astro/src/content/Table.astro'],
        ['npx eslint packages/astro/src/content packages/astro/test'],
      ),
    ];
    expect(baselineCommands(tasks, (path) => !path.endsWith('content'))).toEqual([]);
    expect(baselineCommands(tasks, () => true)).toHaveLength(1);
  });

  it('rapporte les commandes en échec sur la base', async () => {
    const shell = async (cmd) => ({
      code: cmd.includes('check') ? 1 : 0,
      stdout: '3 errors',
      stderr: '',
    });
    const failures = await failingBaseline({ shell, cwd: '/b', timeoutMs: 1 }, [
      'tsc',
      'astro check',
    ]);
    expect(failures).toEqual([{ cmd: 'astro check', code: 1, tail: '3 errors' }]);
  });
});
