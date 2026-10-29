// Arguments des moteurs : kiro-cli (headless) et `claude -p` (repli).

/** Arguments de kiro-cli pour une exécution headless. */
export function kiroArgs({
  agent,
  model,
  effort,
  trustTools,
  prompt,
}: {
  agent: string;
  model: string;
  effort: string;
  trustTools: string[];
  prompt: string;
}): string[] {
  return [
    'chat',
    '--v3',
    '--no-interactive',
    '--agent',
    agent,
    '--model',
    model,
    '--effort',
    effort,
    '--output-format',
    'stream-json',
    '--require-mcp-startup',
    `--trust-tools=${trustTools.join(',')}`,
    prompt,
  ];
}

/** Arguments de `claude -p` (repli) : outils limités, aucune signature, règles du dépôt. */
export function claudeArgs({
  model,
  prompt,
  readOnly,
}: {
  model: string;
  prompt: string;
  readOnly: boolean;
}): string[] {
  const tools = readOnly
    ? 'Read,Grep,Glob,Bash(npm test*),Bash(npm run *),Bash(npx vitest*),Bash(git diff*),Bash(git status*)'
    : 'Read,Grep,Glob,Edit,Write,Bash(npm test*),Bash(npm run *),Bash(npx vitest*),Bash(npx prettier*),Bash(npx eslint*),Bash(git diff*),Bash(git status*)';
  return [
    '-p',
    prompt,
    '--model',
    model,
    '--output-format',
    'stream-json',
    '--verbose',
    '--allowedTools',
    tools,
  ];
}
