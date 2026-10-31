import { aggregate } from '../domain/aggregate/aggregate.ts';
import type { Aggregator } from './ports.ts';

/** Port `Aggregator` implémenté en TypeScript : la référence de la parité avec `pp-data`. */
export const createAggregator = (): Aggregator => ({ aggregate });
