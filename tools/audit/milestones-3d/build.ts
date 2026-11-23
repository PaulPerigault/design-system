// Construction de ce qu'audite l'audit : le .wasm s'il manque, puis la documentation.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function step(root: string, command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(' ')}`);
  const { status } = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (status !== 0) throw new Error(`${command} a échoué (code ${status})`);
}

const wasmBuilt = (root: string): boolean => {
  try {
    return readdirSync(join(root, 'packages/milestones-3d/wasm')).some((f: string) =>
      f.endsWith('.wasm'),
    );
  } catch {
    return false;
  }
};

export function build(root: string): void {
  if (!wasmBuilt(root))
    step(root, 'npm', ['-w', '@paulperigault/milestones-3d', 'run', 'build:wasm']);
  step(root, 'npm', ['-w', '@paulperigault/docs', 'run', 'build']);
}
