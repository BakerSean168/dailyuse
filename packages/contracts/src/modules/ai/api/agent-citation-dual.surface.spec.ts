import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 757: AgentCitation dual body retired.
 * AgentCitationSchema reuses residual 755 KnowledgeCitationSchema.
 */
describe('agent citation dual retired (residual 757)', () => {
  const apiDir = __dirname;
  const agent = readFileSync(resolve(apiDir, 'ai-agent.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('agent reuses KnowledgeCitationSchema without local dual body', () => {
    expect(agent).toContain('Residual 757');
    expect(agent).toContain("from './response-schemas'");
    expect(agent).toContain('export const AgentCitationSchema = KnowledgeCitationSchema');
    expect(agent).toContain(
      'export type AgentCitation = z.infer<typeof AgentCitationSchema>',
    );
    expect(agent).not.toMatch(
      /export const AgentCitationSchema\s*=\s*z\.object\(\{/,
    );
  });

  it('response-schemas residual 755 remains sole citation object body', () => {
    expect(responseSchemas).toContain('Residual 755');
    expect(responseSchemas).toContain(
      'export const KnowledgeCitationSchema = z.object({',
    );
  });

  it('AgentState nests AgentCitationSchema alias', () => {
    expect(agent).toContain('citations: z.array(AgentCitationSchema).default([])');
  });
});
