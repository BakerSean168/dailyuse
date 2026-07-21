import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * GitHub webhook delivery ownership surface (stage-6 residual 110):
 * status transitions must include connectionId in the write filter —
 * never mutate by bare delivery primary key alone.
 */
describe('github webhook delivery ownership surface', () => {
  const port = readFileSync(
    resolve(
      __dirname,
      '../../../../application/ports/knowledge-note-projection.repository.ts',
    ),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../github-webhook-delivery-prisma.repository.ts'),
    'utf8',
  );
  const service = readFileSync(
    resolve(
      __dirname,
      '../../../../application/services/knowledge-repository-projection.service.ts',
    ),
    'utf8',
  );

  it('port updateStatus requires connectionId', () => {
    expect(port).toMatch(
      /updateStatus\(\s*id: string,\s*connectionId: string,\s*status: GithubWebhookDeliveryStatus/,
    );
  });

  it('prisma updates filter by id + connectionId', () => {
    expect(prisma).toMatch(
      /async updateStatus\(\s*id: string,\s*connectionId: string,\s*status: GithubWebhookDeliveryStatus/,
    );
    expect(prisma).toContain('updateMany({');
    expect(prisma).toContain('where: { id, connectionId }');
    expect(prisma).toContain(
      "throw new Error('GitHub webhook delivery not found for the current connection.');",
    );
    // Status mutation must not use bare-primary-key update({ where: { id } }).
    expect(prisma).not.toMatch(
      /githubWebhookDelivery\.update\(\s*\{\s*where:\s*\{\s*id\s*\}/,
    );
  });

  it('projection service passes delivery.connectionId into status transitions', () => {
    expect(service).toMatch(
      /updateStatus\(\s*deliveryId,\s*delivery\.connectionId,\s*'Ignored'/,
    );
    expect(service).toMatch(
      /updateStatus\(\s*delivery\.id,\s*delivery\.connectionId,\s*'Processing'/,
    );
    expect(service).toMatch(
      /updateStatus\(\s*delivery\.id,\s*delivery\.connectionId,\s*'Processed'/,
    );
    expect(service).toMatch(
      /updateStatus\(\s*delivery\.id,\s*delivery\.connectionId,\s*'Failed'/,
    );
    // No bare two-arg status update without connectionId fence.
    expect(service).not.toMatch(
      /deliveryRepository\.updateStatus\(\s*delivery\.id,\s*'(Processing|Processed|Failed|Ignored)'/,
    );
    expect(service).not.toMatch(
      /deliveryRepository\.updateStatus\(\s*deliveryId,\s*'(Processing|Processed|Failed|Ignored)'/,
    );
  });
});
