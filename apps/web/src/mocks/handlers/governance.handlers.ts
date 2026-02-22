/**
 * MSW Handlers - Governance Module
 *
 * Intercepts HTTP requests to the Governance API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import {
  createMockRule,
  createMockRuleList,
  createMockRuleRevision,
  createMockRuleRevisionList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/governance/rules`;

export const governanceHandlers = [
  // GET /api/v1/governance/rules — list rules
  http.get(BASE, () => {
    const rules = createMockRuleList(15);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        items: rules,
        total: rules.length,
      },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/governance/rules/:id — get single rule
  http.get(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRule({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/governance/rules — create rule
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

  // PUT /api/v1/governance/rules/:id — update rule
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockRule({
        id: params.id as string,
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/governance/rules/:id — delete rule
  http.delete(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/governance/rules/search — search rules
  http.get(`${BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const rules = createMockRuleList(5);

    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        items: rules,
        total: rules.length,
        query,
      },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/governance/rules/:id/revisions — get revisions
  http.get(`${BASE}/:id/revisions`, ({ params }) => {
    const revisions = createMockRuleRevisionList(5);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: revisions.map((r) => ({ ...r, ruleId: params.id as string })),
      timestamp: Date.now(),
    });
  }),
];
