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
import type { RepositoryClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';
import { faker } from '@faker-js/faker';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const REPOS = `${API_BASE}/repositories`;
const FOLDERS = `${API_BASE}/folders`;
const RESOURCES = `${API_BASE}/resources`;

const toRepoId = (p: string | readonly string[] | undefined) =>
  (Array.isArray(p) ? p[0] : (p ?? '')) as RepositoryClientDTO['id'];

const toResourceId = (p: string | readonly string[] | undefined) =>
  (Array.isArray(p) ? p[0] : (p ?? '')) as ResourceClientDTO['id'];

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
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRepositoryList(5),
      timestamp: Date.now(),
    });
  }),

  http.post(REPOS, async ({ request }) => {
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

  http.get(`${REPOS}/:id/tree`, ({ params }) => {
    const repoId = toRepoId(params['id']);
    const folders = Array.from({ length: 4 }, (_, i) =>
      createMockFolder({ repositoryId: repoId, name: `文件夹 ${i + 1}` }),
    );
    const resources = createMockResourceList(6, { repositoryId: repoId });
    // Build TreeNode[] from folders + resources
    const tree = [
      ...folders.map((f) => ({
        id: f.id,
        name: f.name,
        type: 'folder' as const,
        parentId: f.parentId,
        repositoryId: repoId as string,
        path: f.path,
        children: [],
      })),
      ...resources.map((r) => ({
        id: r.id as string,
        name: r.name,
        type: 'file' as const,
        parentId: null,
        repositoryId: repoId as string,
        path: `/${r.name}`,
      })),
    ];
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { repositoryId: repoId, tree },
      timestamp: Date.now(),
    });
  }),

  http.post(`${REPOS}/:repositoryId/folders`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockFolder({ repositoryId: params.repositoryId, ...body }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.get(`${REPOS}/:id/resources`, ({ params }) => {
    const resources = createMockResourceList(15, { repositoryId: toRepoId(params['id']) });
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { data: resources, total: resources.length },
      timestamp: Date.now(),
    });
  }),

  http.post(`${REPOS}/:id/resources`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockResource({
          repositoryId: toRepoId(params['id']),
          name: body.name as string,
        }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.get(`${REPOS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRepository({ id: toRepoId(params['id']) }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${REPOS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockRepository({ id: toRepoId(params['id']), ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${REPOS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  http.delete(`${REPOS}/:repositoryId/resources/:resourceId`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.resourceId },
      timestamp: Date.now(),
    });
  }),

  // ============ Folders ============

  http.get(`${FOLDERS}/:folderId/contents`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
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
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockFolder({ id: params.id, ...body }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${FOLDERS}/:id/move`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Moved',
      data: createMockFolder({ id: params.id }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${FOLDERS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Resources ============

  http.get(`${RESOURCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockResource({ id: toResourceId(params['id']) }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${RESOURCES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockResource({ id: toResourceId(params['id']), ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${RESOURCES}/:id/move`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Moved',
      data: createMockResource({ id: toResourceId(params['id']) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${RESOURCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Search ============

  http.post(`${API_BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || 'mock-query';
    const mockResults = createMockResourceList(5).map((r) => ({
      resourceId: r.id as string,
      resourceName: r.name,
      resourcePath: `/${r.name}`,
      resourceType: r.type || 'markdown',
      matchType: 'content' as const,
      matches: [],
      matchCount: 0,
      createdAt: String(r.createdAt ?? Date.now()),
      updatedAt: String(r.updatedAt ?? Date.now()),
    }));
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        results: mockResults,
        totalResults: mockResults.length,
        totalMatches: mockResults.length,
        searchTime: 42,
        query,
        mode: 'all',
      },
      timestamp: Date.now(),
    });
  }),
];
