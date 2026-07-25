/**
 * MSW Handlers - Governance Module
 *
 * Intercepts HTTP requests to the Governance API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import type { GetRuleRevisionsRes } from '@dailyuse/contracts/governance';
import type { RuleId } from '@dailyuse/contracts/primitives';
import {
  createMockRule,
  createMockRuleList,
  createMockRuleRevisionList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/governance/rules`;

export const governanceMockRoutes = {
  base: BASE,
  search: `${BASE}/search`,
  byCode: `${BASE}/by-code`,
  byId: `${BASE}/:id`,
  revisions: `${BASE}/:id/revisions`,
};

const toRuleId = (param: string | readonly string[] | undefined) =>
  (Array.isArray(param) ? param[0] : (param ?? '')) as RuleId;

export function createMockRuleRevisionsResponse(ruleId: RuleId, count = 5): GetRuleRevisionsRes {
  const items = createMockRuleRevisionList(count, { ruleId });
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 20,
  };
}

export const governanceHandlers = [
  // POST /api/v1/governance/rules - create rule
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockRule({ title: body.title as string }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // GET /api/v1/governance/rules/search - search rules
  http.get(`${BASE}/search`, () => {
    const rules = createMockRuleList(5);

    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        items: rules,
        total: rules.length,
        page: 1,
        pageSize: 20,
        searchTime: 15,
      },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/governance/rules/by-code/:code - get single rule by code
  http.get(`${BASE}/by-code/:code`, ({ params }) => {
    const code = Array.isArray(params.code) ? params.code[0] : params.code;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRule({ code: code ?? 'DDD-001' }),
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/governance/rules - list rules
  http.get(BASE, () => {
    const rules = createMockRuleList(15);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        items: rules,
        total: rules.length,
        page: 1,
        pageSize: 20,
      },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/governance/rules/:id/revisions - get revisions
  http.get(`${BASE}/:id/revisions`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRuleRevisionsResponse(toRuleId(params.id)),
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/governance/rules/:id - get single rule
  http.get(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRule({ id: toRuleId(params.id) }),
      timestamp: Date.now(),
    });
  }),

  // PATCH /api/v1/governance/rules/:id - update rule
  http.patch(`${BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockRule({
        id: toRuleId(params.id),
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/governance/rules/:id - delete rule
  http.delete(`${BASE}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null, // void delete: DeleteRuleRes = null (no { success: true } dual-track)
      timestamp: Date.now(),
    });
  }),
];
