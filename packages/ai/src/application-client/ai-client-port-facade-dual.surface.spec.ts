import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 299: AIClientPort is an intentional multi-API thin facade dual.
 * Composes many AI *ApiClient ports (capabilities/provider/conversation/message/
 * knowledge/agent/...). Pure pass-through Result delegation (no domain FromDTO),
 * but not identical to any single I*ApiClient — do not type-alias collapse.
 */
describe('ai client port intentional multi-API facade dual surface', () => {
  const service = readFileSync(resolve(__dirname, 'ai-client-service.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'ai-client.port.ts'), 'utf8');
  const apis = readFileSync(resolve(__dirname, 'ports/ai-api-client.port.ts'), 'utf8');

  it('defines multiple AI API client ports (not a single dual surface)', () => {
    expect(apis).toContain('export interface IAICapabilitiesApiClient');
    expect(apis).toContain('export interface IAIProviderConfigApiClient');
    expect(apis).toContain('export interface IAIConversationApiClient');
    expect(apis).toContain('export interface IAIMessageApiClient');
    expect(apis).toContain('export interface AIKnowledgeNoteApiClient');
    expect(apis).toContain('export interface AIAgentRuntimeApiClient');
    expect(apis).toContain('export interface IAIAssistantApiClient');
  });

  it('AIClientPort is multi-API facade, not type alias of one ApiClient', () => {
    expect(port).toMatch(/export interface AIClientPort\s*\{/);
    expect(port).not.toMatch(/export type AIClientPort\s*=\s*IAI/);
    expect(service).toContain('implements AIClientPort');
    expect(service).toContain('private readonly capabilitiesApi: IAICapabilitiesApiClient');
    expect(service).toContain('private readonly providerApi: IAIProviderConfigApiClient');
    expect(service).toContain('private readonly conversationApi: IAIConversationApiClient');
    expect(service).toContain('private readonly messageApi: IAIMessageApiClient');
    expect(service).toContain('private readonly knowledgeNoteApi: AIKnowledgeNoteApiClient');
    expect(service).toContain('private readonly agentRuntimeApi: AIAgentRuntimeApiClient');
    expect(service).toContain('private readonly assistantApi: IAIAssistantApiClient');
    // thin pass-through style
    expect(service).toContain('return this.capabilitiesApi.getCapabilities()');
    expect(service).toContain('streamMessage');
    expect(service).toContain('dispatchAssistant');
    expect(service).not.toContain('function goalFromDTO');
  });
});
