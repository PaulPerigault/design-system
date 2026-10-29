export interface PlanEntry {
  path: string;
  content: string;
  overwrite?: boolean;
}

export interface PlanOptions {
  dryRun?: boolean | undefined;
  force?: boolean | undefined;
}
