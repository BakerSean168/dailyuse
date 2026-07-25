import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 795: local vault Req dual bodies retired.
 * Sole *ReqSchema + z.infer (select/read/search/open/confirmed-write).
 */
describe('local vault req duals retired (residual 795)', () => {
  const source = readFileSync(resolve(__dirname, 'local-vault-binding.ts'), 'utf8');

  it('owns ReqSchema + z.infer aliases for all vault reqs', () => {
    expect(source).toContain('Residual 795');
    expect(source).toContain('export const SelectLocalVaultReqSchema = z.object({');
    expect(source).toContain(
      'export type SelectLocalVaultReq = z.infer<typeof SelectLocalVaultReqSchema>',
    );
    expect(source).toContain('export const ReadLocalVaultNoteReqSchema = z.object({');
    expect(source).toContain(
      'export type ReadLocalVaultNoteReq = z.infer<typeof ReadLocalVaultNoteReqSchema>',
    );
    expect(source).toContain('export const SearchLocalVaultReqSchema = z.object({');
    expect(source).toContain(
      'export type SearchLocalVaultReq = z.infer<typeof SearchLocalVaultReqSchema>',
    );
    expect(source).toContain(
      'export const OpenLocalVaultInObsidianReqSchema = z.object({',
    );
    expect(source).toContain(
      'export type OpenLocalVaultInObsidianReq = z.infer<typeof OpenLocalVaultInObsidianReqSchema>',
    );
    expect(source).toContain(
      'export const ConfirmedLocalVaultWriteReqSchema = z.object({',
    );
    expect(source).toContain(
      'export type ConfirmedLocalVaultWriteReq = z.infer<typeof ConfirmedLocalVaultWriteReqSchema>',
    );
  });

  it('drops Req interface dual bodies', () => {
    expect(source).not.toMatch(/export interface SelectLocalVaultReq\b/);
    expect(source).not.toMatch(/export interface ReadLocalVaultNoteReq\b/);
    expect(source).not.toMatch(/export interface SearchLocalVaultReq\b/);
    expect(source).not.toMatch(/export interface OpenLocalVaultInObsidianReq\b/);
    expect(source).not.toMatch(/export interface ConfirmedLocalVaultWriteReq\b/);
  });

  it('confirmed write req carries proposal ledger fields', () => {
    expect(source).toContain('proposalId: z.string()');
    expect(source).toContain('proposalRevision: z.number()');
    expect(source).toContain('requestId: z.string()');
    expect(source).toContain('contentMarkdown: z.string()');
    expect(source).toContain('relativePath: z.string()');
  });
});
