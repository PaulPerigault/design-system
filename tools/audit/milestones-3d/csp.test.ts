import { describe, expect, it } from 'vitest';
import { forLocalHttp } from './csp.ts';

describe('forLocalHttp', () => {
  it('retire upgrade-insecure-requests en fin de politique', () => {
    const headers = { 'Content-Security-Policy': "default-src 'none'; upgrade-insecure-requests" };
    forLocalHttp(headers);
    expect(headers['Content-Security-Policy']).toBe("default-src 'none'");
  });

  it('garde les autres directives quand elle est au milieu', () => {
    const headers = { 'Content-Security-Policy': "a 'self'; upgrade-insecure-requests; b 'none'" };
    forLocalHttp(headers);
    expect(headers['Content-Security-Policy']).toBe("a 'self'; b 'none'");
  });

  it('ne touche pas une réponse sans CSP', () => {
    const headers: Record<string, string> = { 'content-type': 'text/css' };
    forLocalHttp(headers);
    expect(headers).toEqual({ 'content-type': 'text/css' });
  });
});
