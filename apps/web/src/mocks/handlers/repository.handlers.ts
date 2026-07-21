import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const REPOS = `${API_BASE}/repositories`;

/**
 * Mock routes for the live knowledge-repository surface only.
 * Legacy database Repository/Folder/Resource CRUD is intentionally absent.
 */
export const repositoryMockRoutes = {
  repositories: REPOS,
  knowledgeConnections: `${REPOS}/knowledge-connections`,
  knowledgeNotes: `${REPOS}/knowledge-notes`,
  knowledgeAttachments: `${REPOS}/knowledge-attachments`,
};

function success<T>(data: T) {
  return HttpResponse.json({
    ok: true,
    code: 200,
    message: 'Success',
    data,
    timestamp: Date.now(),
  });
}

function notFound() {
  return HttpResponse.json(
    {
      ok: false,
      code: 404,
      message: 'Not Found',
      error: { code: 'NOT_FOUND', message: 'Legacy repository route is not mounted' },
      timestamp: Date.now(),
    },
    { status: 404 },
  );
}

export const repositoryHandlers = [
  // Live knowledge repository surface
  http.get(`${REPOS}/knowledge-connections`, () =>
    success({
      connections: [],
    }),
  ),
  http.get(`${REPOS}/knowledge-notes`, () =>
    success({
      notes: [],
    }),
  ),
  http.get(`${REPOS}/knowledge-attachments`, () =>
    success({
      attachments: [],
    }),
  ),

  // Legacy database note mutation surface — must remain unmounted (404)
  http.get(`${REPOS}/current`, () => notFound()),
  http.get(`${REPOS}/:repositoryId/resources`, () => notFound()),
  http.post(`${REPOS}/:repositoryId/resources`, () => notFound()),
  http.post(`${REPOS}/:repositoryId/resources/upload`, () => notFound()),
  http.get(`${REPOS}/:repositoryId/folders`, () => notFound()),
  http.post(`${REPOS}/:repositoryId/folders`, () => notFound()),
  http.get(`${REPOS}/:repositoryId/bookmarks`, () => notFound()),
  http.post(`${REPOS}/:repositoryId/bookmarks`, () => notFound()),
  http.get(`${API_BASE}/resources/:id`, () => notFound()),
  http.put(`${API_BASE}/resources/:id`, () => notFound()),
  http.delete(`${API_BASE}/resources/:id`, () => notFound()),
  http.get(`${API_BASE}/folders/:id/contents`, () => notFound()),
  http.post(`${API_BASE}/search`, () => notFound()),
];
