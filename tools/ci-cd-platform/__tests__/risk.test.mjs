import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyRisk, selectLanes } from '../lib/risk.mjs';

test('classifies highest-risk root and release changes', () => {
  assert.equal(classifyRisk(['docs/README.md']).level, 'docs');
  assert.equal(classifyRisk(['packages/task/src/foo.ts']).level, 'package');
  assert.equal(
    classifyRisk(['apps/web/e2e/foo.spec.ts', 'apps/api/src/routes.ts']).level,
    'web-flow',
  );
  assert.equal(classifyRisk(['.github/workflows/ci.yml']).level, 'root');
  assert.equal(classifyRisk(['.github/workflows/docker-deploy.yml']).level, 'release');
});

test('selects lanes without letting docs-only changes skip governance', () => {
  const scope = {
    boundary: [],
    smoke: [],
    integration: [],
    coverage: [],
    perf: [],
    webFlow: false,
  };
  const lanes = selectLanes({ risk: { level: 'docs' }, scope, event: 'pull_request' });
  assert.equal(lanes.governance, true);
  assert.equal(lanes.validate, true);
  assert.equal(lanes.web, false);
  assert.equal(lanes.integration, false);
});

test('full events enable every lane', () => {
  const lanes = selectLanes({
    risk: { level: 'docs' },
    scope: { boundary: [], smoke: [], integration: [], coverage: [], perf: [], webFlow: false },
    event: 'schedule',
  });
  assert.deepEqual(lanes, {
    governance: true,
    validate: true,
    boundary: true,
    integration: true,
    web: true,
    coverage: true,
    performance: true,
  });
});
