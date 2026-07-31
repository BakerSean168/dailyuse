import { describe, expect, it } from 'vitest';
/*
 * This integration test intentionally exercises standalone workspace tooling
 * that is not modeled as an Nx project. Keep the exception local to this test;
 * production and project-to-project imports remain boundary-enforced.
 */
/* eslint-disable @nx/enforce-module-boundaries */
import {
  evaluateLocalDockerRuntimeEvidence,
  hasBrowserProbeEvidence,
} from '../../agent-skills/validate-local-deploy/scripts/local-docker-evidence.mjs';
import { classifyValidationFailure } from '../../agent-skills/validate-local-deploy/scripts/validation-classification.mjs';
import {
  buildCleanupExecArgs,
  buildCleanupSql,
  normalizeCleanupPrefix,
} from '../../testing/local-docker-pm-cleanup.mjs';

const revision = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function healthyRuntime(overrides = {}) {
  return {
    expectedRevision: revision,
    expectedServices: {
      web: { hostPort: 58080, targetPort: 80 },
      api: { hostPort: 53080, targetPort: 3000 },
      'ai-service': { hostPort: 58100, targetPort: 8100 },
    },
    composeServices: {
      web: {
        name: 'memoflow-web-1',
        state: 'running',
        health: 'healthy',
        publishers: [{ PublishedPort: 58080, TargetPort: 80, Protocol: 'tcp' }],
      },
      api: {
        name: 'memoflow-api-1',
        state: 'running',
        health: 'healthy',
        publishers: [{ PublishedPort: 53080, TargetPort: 3000, Protocol: 'tcp' }],
      },
      'ai-service': {
        name: 'memoflow-ai-service-1',
        state: 'running',
        health: 'healthy',
        publishers: [{ PublishedPort: 58100, TargetPort: 8100, Protocol: 'tcp' }],
      },
    },
    listeners: {
      58080: { open: true, owner: 'docker-compose:web' },
      53080: { open: true, owner: 'docker-compose:api' },
      58100: { open: true, owner: 'docker-compose:ai-service' },
    },
    containerRevisions: {
      web: revision,
      api: revision,
      'ai-service': revision,
    },
    ...overrides,
  };
}

describe('local Docker product validation evidence', () => {
  it('requires healthy listeners, exact compose port mappings, and current revisions', () => {
    const result = evaluateLocalDockerRuntimeEvidence(healthyRuntime());

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.services.web.mappingMatches).toBe(true);
    expect(result.services.api.revisionMatches).toBe(true);
    expect(result.services['ai-service'].listenerOpen).toBe(true);
  });

  it('rejects stale images and a listener that is not mapped to the expected container port', () => {
    const fixture = healthyRuntime();
    fixture.composeServices.web.publishers = [
      { PublishedPort: 58080, TargetPort: 8080, Protocol: 'tcp' },
    ];
    fixture.containerRevisions.api = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    const result = evaluateLocalDockerRuntimeEvidence(fixture);

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/web.*58080.*80/);
    expect(result.errors.join('\n')).toMatch(/api.*revision/);
  });

  it('accepts browser proof only when the unique query token appears in current web logs', () => {
    const token = 'pm-local-docker-browser-171234';
    const logs =
      '127.0.0.1 - - "GET /?__pm_local_docker_probe=pm-local-docker-browser-171234 HTTP/1.1" 200';

    expect(hasBrowserProbeEvidence(logs, token)).toBe(true);
    expect(hasBrowserProbeEvidence(logs, 'pm-local-docker-browser-other')).toBe(false);
  });
});

describe('validation failure classification', () => {
  it.each([
    ['affected-test', false, 'code'],
    ['docker-local-up', false, 'docker-deploy'],
    ['affected-typecheck', true, 'host-tool'],
  ])('classifies %s failures without conflating host tools and product code', (
    label,
    environmentIssue,
    expected,
  ) => {
    expect(classifyValidationFailure({ label, environmentIssue })).toBe(expected);
  });
});

describe('local Docker PM data cleanup', () => {
  it('accepts the fixed PM prefix and emits identity-rooted cascade cleanup SQL', () => {
    const prefix = normalizeCleanupPrefix('pm-phase-');
    const sql = buildCleanupSql(prefix);

    expect(prefix).toBe('pm-phase-');
    expect(sql).toContain('email_address LIKE');
    expect(sql).toContain('DELETE FROM auth_identities');
    expect(sql).toContain('information_schema.columns');
    expect(sql).toContain('WHEN foreign_key_violation');
    expect(sql).toContain('PM cleanup could not resolve dependent identity tables');
  });

  it('uses the postgres container credentials without copying database secrets into host args', () => {
    const sql = buildCleanupSql('pm-phase-');
    const args = buildCleanupExecArgs(sql);

    expect(args).toContain(
      'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$1"',
    );
    expect(args.at(-1)).toBe(sql);
  });

  it.each(['', 'pm-%', 'test', 'pm_phase_'])('rejects unsafe or non-PM prefix %s', (prefix) => {
    expect(() => normalizeCleanupPrefix(prefix)).toThrow();
  });
});
