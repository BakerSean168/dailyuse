/**
 * MSW Handlers - Repository Module
 *
 * Intercepts HTTP requests to the Repository API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import {
  createMockRepository,
  createMockRepositoryList,
  createMockResource,
  createMockResourceList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/repositories`;

export const repositoryHandlers = [
  // GET /api/v1/repositories — list repositories
  http.get(BASE, () => {
    const repositories = createMockRepositoryList(5);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: repositories,
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/repositories/:id — get single repository
  http.get(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRepository({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/repositories — create repository
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockRepository({ name: body.name as string }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // PUT /api/v1/repositories/:id — update repository
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockRepository({
        id: params.id as string,
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/repositories/:id — delete repository
  http.delete(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/repositories/:id/resources — list resources
  http.get(`${BASE}/:id/resources`, ({ params }) => {
    const resources = createMockResourceList(15, {
      repositoryId: params.id as string,
    });
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        data: resources,
        total: resources.length,
      },
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/repositories/:id/resources — create resource
  http.post(`${BASE}/:id/resources`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockResource({
          repositoryId: params.id as string,
          name: body.name as string,
        }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // DELETE /api/v1/repositories/:repositoryId/resources/:resourceId — delete resource
  http.delete(`${BASE}/:repositoryId/resources/:resourceId`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.resourceId },
      timestamp: Date.now(),
    });
  }),
];
