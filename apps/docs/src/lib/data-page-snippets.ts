/** Code à copier de la page Données : un extrait par composant, jeu `visites` défini plus haut. */
const imp = (name: string): string => `import ${name} from '@paulperigault/astro/${name}.astro';`;

export const DATASET = `import type { Dataset } from '@paulperigault/dataviz';

const visites: Dataset = {
  schema: 1,
  x: { kind: 'time', label: 'Mois', values: ['2025-01-01', '2025-02-01', '2025-03-01'] },
  series: [{ id: 'visites', label: 'Visites', unit: 'visites', values: [820, 790, null] }],
};`;

export const SNIPPETS = {
  line: `${imp('LineChart')}

<LineChart id="visites-mensuelles" title="Visites mensuelles en 2025" dataset={visites} />`,
  bar: `${imp('BarChart')}

<BarChart id="visites-rubrique" title="Visites par rubrique" dataset={rubriques} showValues />`,
  area: `${imp('AreaChart')}

<AreaChart id="visites-source" title="Visites par source en 2025" dataset={sources} />`,
  gauge: `${imp('GaugeChart')}

<GaugeChart
  id="remplissage"
  title="Taux de remplissage de la salle"
  value={72}
  unit="%"
  label="Taux de remplissage"
  zones={[
    { label: 'Critique', to: 40, tone: 'bad' },
    { label: 'Vigilance', to: 80, tone: 'warning' },
    { label: 'Nominal', tone: 'good' },
  ]}
/>`,
  kpi: `${imp('KpiCard')}

<KpiCard
  id="visites-mois"
  title="Visites du mois"
  value={1190}
  unit="visites"
  reference={1240}
  referenceLabel="par rapport au mois précédent"
  trend={{ title: 'Visites par mois en 2025', dataset: visites }}
/>`,
  sparkline: `${imp('Sparkline')}

<Sparkline id="visites-trait" title="Visites mensuelles en 2025" dataset={visites} />`,
  table: `${imp('DataTable')}

<DataTable id="visites-tableau" title="Visites par source en 2025" dataset={sources} />`,
  legend: `${imp('Legend')}

<Legend id="sources" items={['Recherche', 'Direct', 'Référents']} />`,
} as const;
