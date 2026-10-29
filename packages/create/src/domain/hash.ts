import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

/** SHA-256 hexadécimal des octets UTF-8, fins de ligne conservées. */
export function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}
