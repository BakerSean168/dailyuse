import type { CloudAuth } from '@memoflow/cloud-auth/server';

export function createCloudAuthStub(): CloudAuth {
  return {
    handler: async () => new Response(null, { status: 404 }),
    expressHandler: (_req, res) => {
      res.sendStatus(404);
    },
    resolvePrincipal: async () => null,
    resolveNodePrincipal: async () => null,
    cleanupExpiredDeviceCodes: async () => 0,
  };
}
