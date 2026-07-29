import {
  createMockRuleRevisionsResponse,
  governanceHandlers,
  governanceMockRoutes,
} from './governance.handlers';
import {
  createHttpClientSpy,
  expectSchemaSuccess,
  successResult,
} from './_shared/contract-test-helpers';
import { describe, expect, it } from 'vitest';
import {
  GetRuleRevisionsResSchema,
  RuleClientDTOSchema,
  SearchRulesResSchema,
} from '@memoflow/contracts/governance';
import { createMockRule } from '@memoflow/contracts/mocks';

type MockHandler = {
  info?: { path?: string; method?: string };
  run(args: {
    request: Request;
    requestId: string;
    resolutionContext?: { baseUrl?: string };
  }): Promise<{ response: Response } | null>;
};

function getHandler(path: string, method: string): MockHandler {
  const handler = governanceHandlers.find((candidate) => {
    const info = candidate as MockHandler;
    return info.info?.path === path && info.info?.method === method;
  }) as MockHandler | undefined;

  expect(handler).toBeDefined();
  return handler!;
}

describe('governance handlers contracts', () => {
  it('uses the current governance client route prefixes and static-before-dynamic order', () => {
    expect(governanceMockRoutes.base).toMatch(/\/api\/v1\/governance\/rules$/);
    expect(governanceMockRoutes.search).toMatch(/\/api\/v1\/governance\/rules\/search$/);
    expect(governanceMockRoutes.byCode).toMatch(/\/api\/v1\/governance\/rules\/by-code$/);

    const paths = governanceHandlers.map((handler) => (handler as MockHandler).info?.path ?? '');
    expect(paths.indexOf(governanceMockRoutes.search)).toBeGreaterThanOrEqual(0);
    expect(paths.indexOf(governanceMockRoutes.byId)).toBeGreaterThanOrEqual(0);
    expect(paths.indexOf(governanceMockRoutes.search)).toBeLessThan(
      paths.indexOf(governanceMockRoutes.byId),
    );
    expect(paths.indexOf(`${governanceMockRoutes.byCode}/:code`)).toBeLessThan(
      paths.indexOf(governanceMockRoutes.byId),
    );
  });

  it('keeps governance revisions response shape aligned with contracts', () => {
    const rule = createMockRule();
    expectSchemaSuccess(GetRuleRevisionsResSchema, createMockRuleRevisionsResponse(rule.id));
  });

  it('exposes the same governance HTTP routes as the client seam', async () => {
    const { createGovernanceHttpClient } = await import('@memoflow/governance/client');
    const httpClient = createHttpClientSpy();
    const client = createGovernanceHttpClient(httpClient);
    const rule = createMockRule();
    const revisions = createMockRuleRevisionsResponse(rule.id);

    httpClient.get
      .mockResolvedValueOnce(successResult(rule))
      .mockResolvedValueOnce(successResult(rule))
      .mockResolvedValueOnce(successResult({ items: [rule], total: 1, page: 1, pageSize: 20 }))
      .mockResolvedValueOnce(
        successResult({
          items: [rule],
          total: 1,
          page: 1,
          pageSize: 20,
          searchTime: 12,
        }),
      )
      .mockResolvedValueOnce(successResult(revisions));

    await client.getRule({ id: rule.id });
    await client.getRule({ code: rule.code });
    await client.listRules({ page: 1, pageSize: 20 });
    await client.searchRules({ query: 'ddd', page: 1, pageSize: 20 });
    await client.getRevisions({ ruleId: rule.id, page: 1, pageSize: 20 });

    expect(httpClient.get).toHaveBeenNthCalledWith(1, `/governance/rules/${rule.id}`);
    expect(httpClient.get).toHaveBeenNthCalledWith(2, `/governance/rules/by-code/${rule.code}`);
    expect(httpClient.get).toHaveBeenNthCalledWith(3, '/governance/rules', {
      params: { page: 1, pageSize: 20 },
    });
    expect(httpClient.get).toHaveBeenNthCalledWith(4, '/governance/rules/search', {
      params: { query: 'ddd', page: 1, pageSize: 20 },
    });
    expect(httpClient.get).toHaveBeenNthCalledWith(5, `/governance/rules/${rule.id}/revisions`, {
      params: { page: 1, pageSize: 20 },
    });
  });

  it('returns by-code and revisions payloads that match contracts', async () => {
    const rule = createMockRule();
    const byCodeHandler = getHandler(`${governanceMockRoutes.byCode}/:code`, 'GET');
    const revisionsHandler = getHandler(governanceMockRoutes.revisions, 'GET');

    const byCodeResult = await byCodeHandler.run({
      request: new Request(new URL(`${governanceMockRoutes.byCode}/${rule.code}`, 'http://localhost'), {
        method: 'GET',
      }),
      requestId: 'governance-by-code',
      resolutionContext: { baseUrl: 'http://localhost' },
    });
    const revisionsResult = await revisionsHandler.run({
      request: new Request(
        new URL(`${governanceMockRoutes.base}/${rule.id}/revisions`, 'http://localhost'),
        { method: 'GET' },
      ),
      requestId: 'governance-revisions',
      resolutionContext: { baseUrl: 'http://localhost' },
    });

    expect(byCodeResult?.response.status).toBe(200);
    const byCodeJson = (await byCodeResult?.response.json()) as { data: unknown };
    expectSchemaSuccess(RuleClientDTOSchema, byCodeJson.data);

    expect(revisionsResult?.response.status).toBe(200);
    const revisionsJson = (await revisionsResult?.response.json()) as { data: unknown };
    expectSchemaSuccess(GetRuleRevisionsResSchema, revisionsJson.data);
  });

  it('returns search payloads that match contracts', async () => {
    const searchHandler = getHandler(governanceMockRoutes.search, 'GET');
    const searchResult = await searchHandler.run({
      request: new Request(
        new URL(`${governanceMockRoutes.search}?query=ddd&page=1&pageSize=20`, 'http://localhost'),
        { method: 'GET' },
      ),
      requestId: 'governance-search',
      resolutionContext: { baseUrl: 'http://localhost' },
    });

    expect(searchResult?.response.status).toBe(200);
    const searchJson = (await searchResult?.response.json()) as { data: unknown };
    expectSchemaSuccess(SearchRulesResSchema, searchJson.data);
  });
});
