import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 223: knowledge note mutation bus event uses Note naming.
 * Event id repository:note:mutated; payload still carries protocol resourceId/resourcePath.
 */
describe('repository note mutation event surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const events = readFileSync(
    resolve(repoRoot, 'packages/contracts/src/modules/repository/domain/events/index.ts'),
    'utf8',
  );
  const eventMap = readFileSync(
    resolve(repoRoot, 'packages/contracts/src/modules/repository/protocol/repository-event-map.ts'),
    'utf8',
  );
  const publisher = readFileSync(
    resolve(__dirname, 'repository-note-mutation.publisher.ts'),
    'utf8',
  );
  const autoIndex = readFileSync(
    resolve(
      repoRoot,
      'packages/ai/src/server/infrastructure/runtime/knowledge-auto-index.runtime.ts',
    ),
    'utf8',
  );

  it('contracts expose repository:note:mutated and Note type names', () => {
    expect(events).toContain("REPOSITORY_NOTE_MUTATED_EVENT = 'repository:note:mutated'");
    expect(events).toContain('RepositoryNoteMutationType');
    expect(events).toContain('RepositoryNoteMutatedEvent');
    expect(events).toContain('resourceId: ResourceId');
    expect(events).toContain('resourcePath: string');
    expect(events).not.toContain('REPOSITORY_RESOURCE_MUTATED_EVENT');
    expect(events).not.toContain('RepositoryResourceMutatedEvent');
    expect(events).not.toContain("repository:resource:mutated");
    expect(eventMap).toContain("'repository:note:mutated'");
    expect(eventMap).not.toContain("'repository:resource:mutated'");
  });

  it('publisher and AI auto-index subscribe to note mutation only', () => {
    expect(publisher).toContain('publishRepositoryNoteMutation');
    expect(publisher).toContain('REPOSITORY_NOTE_MUTATED_EVENT');
    expect(publisher).not.toContain('publishRepositoryResourceMutation');
    expect(autoIndex).toContain('REPOSITORY_NOTE_MUTATED_EVENT');
    expect(autoIndex).toContain('handleNoteMutation');
    expect(autoIndex).not.toContain('REPOSITORY_RESOURCE_MUTATED_EVENT');
    expect(autoIndex).not.toContain('handleResourceMutation');
    expect(
      existsSync(resolve(__dirname, 'repository-resource-mutation.publisher.ts')),
    ).toBe(false);
    expect(existsSync(resolve(__dirname, 'repository-note-mutation.publisher.ts'))).toBe(true);
  });
});
