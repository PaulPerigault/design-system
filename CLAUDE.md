@AGENTS.md

# Consignes d'orchestration (Claude Code)

Référence : `docs/kickoff.md` (kickoff + addenda datés ; l'addendum prime). Rapport de fond : `docs/research-report.md`.

- **Rôle :** orchestrateur. Je découpe, j'écris les fichiers de tâche, je lance le dispatcher, j'arbitre, je relis, je fusionne dans `main` et je tiens le journal. Les tâches délégables vont à Kiro en priorité ; mes sous-agents ne servent qu'en repli (échec après escalade, quota, Kiro indisponible).
- **Dispatcher :** `node tools/agents/run.ts tasks/<id>.md` (une tâche), `node tools/agents/batch.ts --lot L3 --parallel 3` (un lot, au plus 3 en parallèle). Résultats dans `.agents/runs/<id>.result.json`, résumé lisible `.agents/runs/<id>.summary.md`, routage dans `.agents/routing-log.jsonl`.
- **Routage :** paliers `mech` → `light` → `std` → `hard` (`tools/agents/models.json`). Un échec fait monter d'un palier, jamais deux fois au même palier ; après `hard`, je reprends la tâche. Les tâches `hard` sont relues par `ds-reviewer` en `claude-opus-5.5` puis par un autre éditeur (`gpt-5.6-terra`).
- **ds-lead :** second moteur Kiro (D-014). Lancement : `nohup node tools/agents/lead.ts >> .agents/lead.log 2>&1 &`. À chaque reprise, lire en priorité `.agents/lead.log` et `.agents/lead-queue.md` ; valider chaque lot « prêt pour validation » (verify, e2e, diff, bilan), puis PR et fusion, ou renvoi avec retours ; deux échecs = reprise par l'orchestrateur.
- **Fusions :** une PR squash par lot vers `main`, message de squash = corps de la PR, CI verte exigée. Jamais de push direct sur `main`, jamais de `publish`, jamais de push forcé.
- **Interdits :** tout `apply` OpenTofu, toute publication npm (vérifier avec `npm pack --dry-run`), toute écriture hors de `~/dev/design-system`, `~/dev/ds-wt` et du portfolio, toute modification de la configuration npm ou Claude Code de l'utilisateur, tout secret transmis à Kiro, toute modification du favicon du portfolio.
- **Journal :** une entrée dans `docs/journal/AAAA-MM-JJ.md` par tâche lancée, terminée, échouée ou escaladée, par décision et par blocage ; jamais plus de 30 minutes sans entrée. Bilan de lot dans `docs/lots/Lx.md`, `docs/run-report.md` mis à jour à chaque fin de lot.
