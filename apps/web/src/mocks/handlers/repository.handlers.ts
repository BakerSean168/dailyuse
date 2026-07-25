import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const REPOS = `${API_BASE}/repositories`;

/**
 * Mock routes for the live knowledge-repository surface only.
 * Legacy database Repository/Folder/Resource/Bookmark CRUD is not registered
 * (no dual-track 404 stubs). Unhandled paths use MSW onUnhandledRequest bypass.
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

export const repositoryHandlers = [
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
];
