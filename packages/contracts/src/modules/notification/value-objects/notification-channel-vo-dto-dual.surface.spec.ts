import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 849: ChannelResponseDTO / ChannelErrorDTO / RateLimitDTO dual bodies retired.
 * Sole VO interface + `export type XDTO = X` for each exact-match pair.
 */
describe('notification channel vo dto duals retired (residual 849)', () => {
  const voDir = __dirname;
  const response = readFileSync(resolve(voDir, 'channel-response.ts'), 'utf8');
  const error = readFileSync(resolve(voDir, 'channel-error.ts'), 'utf8');
  const rate = readFileSync(resolve(voDir, 'rate-limit.ts'), 'utf8');
  const index = readFileSync(resolve(voDir, 'index.ts'), 'utf8');

  it('owns ChannelResponseDTO as type alias of ChannelResponse', () => {
    expect(response).toContain('Residual 849');
    expect(response).toMatch(/export interface ChannelResponse\b/);
    expect(response).toContain('export type ChannelResponseDTO = ChannelResponse');
    expect(response).not.toMatch(/export interface ChannelResponseDTO\b/);
  });

  it('owns ChannelErrorDTO as type alias of ChannelError', () => {
    expect(error).toContain('Residual 849');
    expect(error).toMatch(/export interface ChannelError\b/);
    expect(error).toContain('export type ChannelErrorDTO = ChannelError');
    expect(error).not.toMatch(/export interface ChannelErrorDTO\b/);
  });

  it('owns RateLimitDTO as type alias of RateLimit; barrel still exports all six names', () => {
    expect(rate).toContain('Residual 849');
    expect(rate).toMatch(/export interface RateLimit\b/);
    expect(rate).toContain('export type RateLimitDTO = RateLimit');
    expect(rate).not.toMatch(/export interface RateLimitDTO\b/);
    expect(index).toContain('ChannelResponse');
    expect(index).toContain('ChannelResponseDTO');
    expect(index).toContain('ChannelError');
    expect(index).toContain('ChannelErrorDTO');
    expect(index).toContain('RateLimit');
    expect(index).toContain('RateLimitDTO');
  });
});
