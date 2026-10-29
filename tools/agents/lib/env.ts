// Environnement des exécutants : aucun secret transmis (jetons, clés, identifiants cloud), et la
// configuration npm de l'utilisateur remplacée par un fichier vide (le `.npmrc` du projet force
// npmjs). La session Kiro passe par ses fichiers (`kiro-cli login`), jamais par l'environnement.

const SENSITIVE =
  /TOKEN|SECRET|PASSW|KEY|CREDENTIAL|AUTH|COOKIE|SESSION|^NPM_|^NODE_AUTH|^GH_|^GITHUB_|^AWS_|^CLOUDFLARE|^OVH|^TF_VAR|^RESEND|^TURNSTILE|^KIRO_API/i;

/** `base` : environnement du dispatcher. */
export function executorEnv(
  base: Record<string, string | undefined>,
  { emptyNpmrc, hookLog }: { emptyNpmrc: string; hookLog?: string | undefined },
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(base)) {
    if (value !== undefined && !SENSITIVE.test(key) && !/^npm_config_/i.test(key)) {
      env[key] = value;
    }
  }
  env.npm_config_userconfig = emptyNpmrc;
  env.npm_config_update_notifier = 'false';
  if (hookLog) env.DS_HOOK_LOG = hookLog;
  return env;
}
