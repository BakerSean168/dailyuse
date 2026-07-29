import type { RequestHandler } from 'express';
import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { RepositoryApplicationPort } from '../../server/application';
import { registerKnowledgeRepositoryConnectionRoutes } from './knowledge-repository-connection.routes';
import { registerRepositoryRoutes } from './index';

type RouteHandler = (
  req: Record<string, unknown>,
  res: {
    status(code: number): unknown;
    json(data: unknown): unknown;
  },
) => unknown;

type LayerWithRoute = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: RouteHandler }>;
  };
};

const passThrough = ((_, __, next) => next()) as RequestHandler;

function createApiStub(): RepositoryApplicationPort {
  return {
    startKnowledgeRepositoryInstallation: vi.fn(async () =>
      ok({
        installationUrl: 'https://github.com/apps/memoflow/installations/new?state=state-1',
        expiresAt: 1_750_000_600_000,
      }),
    ),
    completeKnowledgeRepositoryInstallation: vi.fn(),
    listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [] })),
    connectKnowledgeRepository: vi.fn(),
    disconnectKnowledgeRepository: vi.fn(async () => ok(null)),
    previewKnowledgeRepositoryReconciliation: vi.fn(async () =>
      ok({
        connectionId: 'connection-1',
        localState: 'NonEmpty',
        remoteState: 'Empty',
        action: 'InitializeRemoteFromLocal',
        defaultBranch: 'main',
        remoteHeadSha: null,
      }),
    ),
    confirmKnowledgeRepositoryHead: vi.fn(async () =>
      ok({
        id: 'connection-1',
        identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
        githubUserId: '42',
        githubRepositoryId: 'repository-1',
        githubRepositoryFullName: 'owner/knowledge',
        installationId: 'installation-1',
        defaultBranch: 'main',
        status: 'Active' as const,
        lastSyncedCommitSha: 'a'.repeat(40),
        lastErrorCode: null,
        canSync: true,
        createdAt: 1 as never,
        updatedAt: 2 as never,
      }),
    ),
    issueDesktopKnowledgeRepositoryToken: vi.fn(async () =>
      ok({
        token: 'short-lived-token',
        expiresAt: 1_750_000_300_000,
        repositoryId: 'repository-1',
      }),
    ),
    getKnowledgeNoteLinkGraph: vi.fn(async () =>
      ok({
        centerProjectionId: 'projection-1',
        depth: 2,
        nodes: [],
        edges: [],
        unresolvedLinks: [],
        truncated: false,
      }),
    ),
    listKnowledgeAttachmentProjections: vi.fn(async () => ok({ attachments: [] })),
    getKnowledgeAttachmentContent: vi.fn(async () =>
      ok({
        attachment: {
          id: 'attachment-1',
          connectionId: 'connection-1',
          relativePath: 'assets/diagram.png',
          fileName: 'diagram.png',
          commitSha: 'commit-1',
          blobSha: 'blob-1',
          byteSize: 4,
          mediaType: 'image/png',
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
        contentBase64: 'AQIDBA==',
      }),
    ),
  } as unknown as RepositoryApplicationPort;
}

function getRouteHandler(router: Router, method: string, path: string): RouteHandler {
  const layer = (router as unknown as { stack: LayerWithRoute[] }).stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method.toLowerCase()] === true,
  );

  expect(layer?.route).toBeDefined();
  return layer!.route!.stack.at(-1)!.handle;
}

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('knowledge repository connection routes', () => {
  it('keeps legacy database Repository/Folder/Resource routes outside the mounted API', () => {
    const router = registerRepositoryRoutes(createApiStub(), { auth: passThrough });
    const paths = (router as unknown as { stack: LayerWithRoute[] }).stack
      .map((layer) => layer.route?.path)
      .filter((path): path is string => typeof path === 'string');

    expect(paths).toContain('/knowledge-connections');
    expect(paths).toContain('/knowledge-notes');
    expect(paths).not.toContain('/:repoId/resources');
    expect(paths).not.toContain('/:repoId/folders');
    expect(paths).not.toContain('/:id');
  });

  it('forwards an explicit cloud-data purge choice on disconnect', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(router, 'delete', '/knowledge-connections/:connectionId');
    const res = createResponse();

    await handler(
      {
        params: { connectionId: 'connection-1' },
        query: { purgeCloudData: 'true' },
        headers: { 'user-agent': 'Mozilla/5.0' },
        user: { identityId: 'identity-route' },
      },
      res,
    );

    expect(api.disconnectKnowledgeRepository).toHaveBeenCalledWith(
      expect.objectContaining({ identityId: 'identity-route' }),
      'connection-1',
      true,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards the authenticated identity and validated installation request', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, {
      auth: passThrough,
      requireEmailVerified: passThrough,
    });
    const handler = getRouteHandler(router, 'post', '/knowledge-connections/installations/start');
    const req = {
      body: { returnUrl: 'https://app.example.test/settings/repository' },
      headers: { 'user-agent': 'Mozilla/5.0' },
      user: { identityId: 'identity-route' },
      traceId: 'trace-installation-start',
    };
    const res = createResponse();

    await handler(req, res);

    expect(api.startKnowledgeRepositoryInstallation).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-route',
        device: expect.objectContaining({ deviceType: 'Browser' }),
      }),
      { returnUrl: 'https://app.example.test/settings/repository' },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({ installationUrl: expect.stringContaining('github.com') }),
      }),
    );
  });

  it('rejects invalid callback input before invoking the application port', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(
      router,
      'post',
      '/knowledge-connections/installations/complete',
    );
    const res = createResponse();

    await handler(
      {
        body: { state: 'short', installationId: '' },
        headers: {},
        user: { identityId: 'identity-route' },
      },
      res,
    );

    expect(api.completeKnowledgeRepositoryInstallation).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      }),
    );
  });

  it('derives a Desktop-only token context from the Electron transport edge', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(
      router,
      'post',
      '/knowledge-connections/:connectionId/desktop-token',
    );
    const res = createResponse();

    await handler(
      {
        params: { connectionId: 'connection-1' },
        headers: {
          'user-agent': 'Mozilla/5.0 MemoFlow/1.0 Electron/36.0.0',
          'x-device-id': 'desktop-device-1',
        },
        user: { identityId: 'identity-desktop' },
      },
      res,
    );

    expect(api.issueDesktopKnowledgeRepositoryToken).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-desktop',
        deviceId: 'desktop-device-1',
        device: expect.objectContaining({ deviceType: 'Desktop' }),
      }),
      'connection-1',
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards a validated first-reconciliation preflight in Desktop context', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(
      router,
      'post',
      '/knowledge-connections/:connectionId/reconciliation-preview',
    );
    const res = createResponse();

    await handler(
      {
        params: { connectionId: 'connection-1' },
        body: { localState: 'NonEmpty' },
        headers: { 'user-agent': 'MemoFlow/1.0 Electron/43.0.0' },
        user: { identityId: 'identity-desktop' },
      },
      res,
    );

    expect(api.previewKnowledgeRepositoryReconciliation).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-desktop',
        device: expect.objectContaining({ deviceType: 'Desktop' }),
      }),
      'connection-1',
      { localState: 'NonEmpty' },
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards a validated reconciliation confirmation in Desktop context', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(
      router,
      'post',
      '/knowledge-connections/:connectionId/head-confirmation',
    );
    const res = createResponse();

    await handler(
      {
        params: { connectionId: 'connection-1' },
        body: { headSha: 'a'.repeat(40) },
        headers: { 'user-agent': 'MemoFlow/1.0 Electron/43.0.0' },
        user: { identityId: 'identity-desktop' },
      },
      res,
    );

    expect(api.confirmKnowledgeRepositoryHead).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-desktop',
        device: expect.objectContaining({ deviceType: 'Desktop' }),
      }),
      'connection-1',
      { headSha: 'a'.repeat(40) },
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 401 before invoking a protected route without an authenticated identity', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(router, 'get', '/knowledge-connections');
    const res = createResponse();

    await handler({ headers: {} }, res);

    expect(api.listKnowledgeRepositoryConnections).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('validates and forwards an identity-scoped knowledge note link graph query', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(router, 'get', '/knowledge-notes/:projectionId/link-graph');
    const res = createResponse();

    await handler(
      {
        params: { projectionId: 'projection-1' },
        query: { depth: '2', maxNodes: '30' },
        headers: { 'user-agent': 'Mozilla/5.0' },
        user: { identityId: 'identity-route' },
      },
      res,
    );

    expect(api.getKnowledgeNoteLinkGraph).toHaveBeenCalledWith(
      expect.objectContaining({ identityId: 'identity-route' }),
      'projection-1',
      { depth: 2, maxNodes: 30 },
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('requires an identity and scopes attachment content reads to that identity', async () => {
    const api = createApiStub();
    const router = registerKnowledgeRepositoryConnectionRoutes(api, { auth: passThrough });
    const handler = getRouteHandler(router, 'get', '/knowledge-attachments/:projectionId/content');
    const unauthorized = createResponse();

    await handler(
      { params: { projectionId: 'attachment-1' }, headers: { 'user-agent': 'Mozilla/5.0' } },
      unauthorized,
    );

    expect(unauthorized.status).toHaveBeenCalledWith(401);
    expect(api.getKnowledgeAttachmentContent).not.toHaveBeenCalled();

    const authorized = createResponse();
    await handler(
      {
        params: { projectionId: 'attachment-1' },
        headers: { 'user-agent': 'Mozilla/5.0' },
        user: { identityId: 'identity-route' },
      },
      authorized,
    );

    expect(api.getKnowledgeAttachmentContent).toHaveBeenCalledWith(
      expect.objectContaining({ identityId: 'identity-route' }),
      'attachment-1',
    );
    expect(authorized.status).toHaveBeenCalledWith(200);
    expect(authorized.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({ contentBase64: 'AQIDBA==' }),
      }),
    );
  });
});
