/**
 * MSW Handlers - Repository Module
 *
 * Paths match the actual HTTP adapter:
 *   - RepositoryHttpAdapter: /repositories, /folders, /resources, /search
 */

import { http, HttpResponse } from 'msw';
import {
  createMockRepository,
  createMockRepositoryList,
  createMockResource,
  createMockResourceList,
} from '@dailyuse/contracts/mocks';
import { faker } from '@faker-js/faker';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const REPOS = `${API_BASE}/repositories`;
const FOLDERS = `${API_BASE}/folders`;
const RESOURCES = `${API_BASE}/resources`;

function createMockFolder(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    repositoryId: faker.string.uuid(),
    parentId: null,
    name: faker.helpers.arrayElement(['文档', '笔记', '项目', '资料', '存档']),
    path: '/' + faker.system.directoryPath(),
    depth: faker.number.int({ min: 0, max: 3 }),
    sortOrder: faker.number.int({ min: 0, max: 10 }),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export const repositoryHandlers = [
  // ============ Repositories ============

  http.get(REPOS, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockRepositoryList(5),
      timestamp: Date.now(),
    });
  }),

  http.post(REPOS, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ok: true, code: 200, message: 'Created', data: createMockRepository({ name: body.name as string }), timestamp: Date.now() },
      { status: 201 },
    );
  }),

  http.get(`${REPOS}/:id/tree`, ({ params }) => {
    const folders = Array.from({ length: 4 }, (_, i) =>
      createMockFolder({ repositoryId: params.id, name: `文件夹 ${i + 1}` }),
    );
    const resources = createMockResourceList(6, { repositoryId: params.id as string });
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { folders, resources },
      timestamp: Date.now(),
    });
  }),

  http.post(`${REPOS}/:repositoryId/folders`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ok: true, code: 200, message: 'Created', data: createMockFolder({ repositoryId: params.repositoryId, ...body }), timestamp: Date.now() },
      { status: 201 },
    );
  }),

  http.get(`${REPOS}/:id/resources`, ({ params }) => {
    const resources = createMockResourceList(15, { repositoryId: params.id as string });
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { data: resources, total: resources.length },
      timestamp: Date.now(),
    });
  }),

  http.post(`${REPOS}/:id/resources`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ok: true, code: 200, message: 'Created', data: createMockResource({ repositoryId: params.id as string, name: body.name as string }), timestamp: Date.now() },
      { status: 201 },
    );
  }),

  http.get(`${REPOS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockRepository({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${REPOS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockRepository({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${REPOS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  http.delete(`${REPOS}/:repositoryId/resources/:resourceId`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.resourceId },
      timestamp: Date.now(),
    });
  }),

  // ============ Folders ============

  http.get(`${FOLDERS}/:folderId/contents`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: {
        folders: Array.from({ length: 2 }, () => createMockFolder()),
        resources: createMockResourceList(5),
      },
      timestamp: Date.now(),
    });
  }),

  http.patch(`${FOLDERS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockFolder({ id: params.id, ...body }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${FOLDERS}/:id/move`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Moved',
      data: createMockFolder({ id: params.id }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${FOLDERS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Resources ============

  http.get(`${RESOURCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockResource({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${RESOURCES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockResource({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${RESOURCES}/:id/move`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Moved',
      data: createMockResource({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${RESOURCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Search ============

  http.post(`${API_BASE}/search`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { results: createMockResourceList(5), total: 5 },
      timestamp: Date.now(),
    });
  }),
];
