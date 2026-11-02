// Option Effect-TS (ADR-0010) : hors du cœur, le cœur n'en dépend jamais.
export { FileSystemError, ValidationError } from './errors.ts';
export { clockLayer, fileSystemLayer, now, readText, writeText } from './layers.ts';
export { Clock, FileSystem } from './ports.ts';
export type { ClockPort, FileSystemPort } from './ports.ts';
export { Hue, validate } from './validate.ts';
