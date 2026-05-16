import { http, HttpResponse } from 'msw';
import {
  createMockRepository,
  createMockResource,
  createMockResourceList,
} from '@dailyuse/contracts/mocks';
import type {
  RepositoryClientDTO,
  ResourceBookmarkClientDTO,
  ResourceClientDTO,
  SearchMode,
  SearchResponse,
  UploadResourcesResponseDTO,
} from '@dailyuse/contracts/repository';
import { faker } from '@faker-js/faker';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const REPOS = `${API_BASE}/repositories`;
const FOLDERS = `${API_BASE}/folders`;
const RESOURCES = `${API_BASE}/resources`;
const SEARCH = `${API_BASE}/search`;

export const repositoryMockRoutes = {
  repositories: REPOS,
  current: `${REPOS}/current`,
  folders: FOLDERS,
  resources: RESOURCES,
  search: SEARCH,
};

const toRepoId = (p: string | readonly string[] | undefined) =>
  (Array.isArray(p) ? p[0] : (p ?? '')) as RepositoryClientDTO['id'];

const toResourceId = (p: string | readonly string[] | undefined) =>
  (Array.isArray(p) ? p[0] : (p ?? '')) as ResourceClientDTO['id'];

const toBookmarkId = (p: string | readonly string[] | undefined) =>
  (Array.isArray(p) ? p[0] : (p ?? '')) as ResourceBookmarkClientDTO['id'];

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

export function createMockResourceBookmark(
  overrides: Partial<ResourceBookmarkClientDTO> = {},
): ResourceBookmarkClientDTO {
  const fallbackName = faker.helpers.arrayElement(['Inbox.md', 'Ideas.md', 'Plan.md']);
  return {
    id: overrides.id ?? (faker.string.uuid() as ResourceBookmarkClientDTO['id']),
    resourceId:
      overrides.resourceId ?? (faker.string.uuid() as ResourceBookmarkClientDTO['resourceId']),
    identityId:
      overrides.identityId ?? (faker.string.uuid() as ResourceBookmarkClientDTO['identityId']),
    aliasName: overrides.aliasName ?? null,
    icon: overrides.icon ?? null,
    color: overrides.color ?? null,
    sortOrder: overrides.sortOrder ?? 0,
    version: overrides.version ?? 1,
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
    deletedAt: overrides.deletedAt ?? null,
    displayName: overrides.displayName ?? overrides.aliasName ?? fallbackName,
    isOwner: overrides.isOwner ?? true,
  };
}

export function createMockUploadResourcesResponse(
  repositoryId: string,
  fileNames: string[],
): UploadResourcesResponseDTO {
  const resources = fileNames.map((fileName) =>
    createMockResource({ repositoryId: repositoryId as RepositoryClientDTO['id'], name: fileName }),
  );
  return {
    successes: resources.map((resource, index) => ({
      fileName: fileNames[index] ?? resource.name,
      resource,
    })),
    failures: [],
    resources,
  };
}

export function createMockRepositorySearchResponse(
  query: string,
  mode: SearchMode = 'all',
): SearchResponse {
  const results: SearchResponse['results'] = createMockResourceList(5).map((resource, index) => ({
    resourceId: resource.id,
    resourceName: resource.name,
    resourcePath: `/${resource.name}`,
    resourceType: resource.type || 'markdown',
    matchType: 'content' as const,
    matches: [
      {
        lineNumber: index + 1,
        lineContent: `${query} match in ${resource.name}`,
        startIndex: 0,
        endIndex: query.length,
      },
    ],
    matchCount: 1,
    createdAt: String(resource.createdAt ?? Date.now()),
    updatedAt: String(resource.updatedAt ?? Date.now()),
  }));

  return {
    results,
    totalResults: results.length,
    totalMatches: results.length,
    searchTime: 42,
    query,
    mode,
  };
}

export const repositoryHandlers = [
  http.get(`${REPOS}/current`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRepository(),
      timestamp: Date.now(),
    });
  }),

  http.get(`${REPOS}/:id/tree`, ({ params }) => {
    const repoId = toRepoId(params['id']);
    const folders = Array.from({ length: 4 }, (_, index) =>
      createMockFolder({ repositoryId: repoId, name: `文件夹 ${index + 1}` }),
    );
    const resources = createMockResourceList(6, { repositoryId: repoId });
    const tree = [
      ...folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        parentId: folder.parentId,
        repositoryId: repoId as string,
        path: folder.path,
        children: [],
      })),
      ...resources.map((resource) => ({
        id: resource.id as string,
        name: resource.name,
        type: 'file' as const,
        parentId: null,
        repositoryId: repoId as string,
        path: `/${resource.name}`,
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
      data: resources,
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

  http.post(`${REPOS}/:repoId/resources/upload`, async ({ params, request }) => {
    const formData = await request.formData();
    const fileNames = formData
      .getAll('files')
      .map((file) => (file instanceof File ? file.name : null))
      .filter((fileName): fileName is string => Boolean(fileName));

    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Uploaded',
      data: createMockUploadResourcesResponse(params.repoId as string, fileNames),
      timestamp: Date.now(),
    });
  }),

  http.get(`${REPOS}/:repoId/bookmarks`, ({ params }) => {
    const resourceId = createMockResource({ repositoryId: toRepoId(params['repoId']) }).id;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: [createMockResourceBookmark({ resourceId, displayName: 'Inbox.md' })],
      timestamp: Date.now(),
    });
  }),

  http.post(`${REPOS}/:repoId/bookmarks`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const aliasName = typeof body.aliasName === 'string' ? body.aliasName : null;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockResourceBookmark({
          resourceId: String(
            body.resourceId ?? createMockResource().id,
          ) as ResourceBookmarkClientDTO['resourceId'],
          aliasName,
          displayName: aliasName ?? 'Pinned resource',
        }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.patch(`${REPOS}/:repoId/bookmarks/:bookmarkId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const aliasName = typeof body.aliasName === 'string' ? body.aliasName : null;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockResourceBookmark({
        id: toBookmarkId(params.bookmarkId),
        aliasName,
        displayName: aliasName ?? 'Pinned resource',
      }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${REPOS}/:repoId/bookmarks/reorder`, async ({ request }) => {
    const body = (await request.json()) as { bookmarkIds?: string[] };
    const bookmarkIds = body.bookmarkIds ?? [];
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: bookmarkIds.map((bookmarkId, index) =>
        createMockResourceBookmark({ id: toBookmarkId(bookmarkId), sortOrder: index }),
      ),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${REPOS}/:repoId/bookmarks/:bookmarkId`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
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

  http.delete(`${REPOS}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
  }),

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

  http.delete(`${FOLDERS}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
  }),

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

  http.put(`${RESOURCES}/:id`, async ({ params, request }) => {
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

  http.delete(`${RESOURCES}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
  }),

  http.post(SEARCH, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      mode?: SearchMode;
    };
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockRepositorySearchResponse(body.query ?? 'mock-query', body.mode ?? 'all'),
      timestamp: Date.now(),
    });
  }),
];
