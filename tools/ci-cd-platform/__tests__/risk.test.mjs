import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyRisk, selectLanes } from '../lib/risk.mjs';

test('classifies highest-risk root and release changes', () => {
  assert.equal(classifyRisk(['docs/README.md']).level, 'docs');
  assert.equal(classifyRisk(['packages/task/src/foo.ts']).level, 'package');
  const desktop = classifyRisk([
    'apps/desktop/src/main/main.ts',
    'packages/repository/src/electron/local-vault-runtime.ts',
  ]);
  assert.equal(desktop.level, 'desktop');
  assert.ok(desktop.matchedLevels.includes('desktop'));
  assert.ok(!desktop.matchedLevels.includes('web-flow'));
  assert.equal(
    classifyRisk(['apps/web/e2e/foo.spec.ts', 'apps/api/src/routes.ts']).level,
    'web-flow',
  );
  assert.equal(classifyRisk(['.github/workflows/ci.yml']).level, 'root');
  assert.equal(classifyRisk(['.github/workflows/publish-images.yml']).level, 'release');
  assert.equal(classifyRisk(['.github/workflows/release-publish.yml']).level, 'release');
  assert.equal(classifyRisk(['.github/workflows/deploy-production.yml']).level, 'release');
  assert.equal(classifyRisk(['deployment/production/production-deploy-watch.sh']).level, 'release');
  assert.equal(classifyRisk(['tools/ci-cd-platform/production-manifest.mjs']).level, 'release');
  assert.equal(
    classifyRisk(['tools/ci-cd-platform/release-tools/release-contract.mjs']).level,
    'release',
  );
});

test('selects lanes without letting docs-only changes skip governance', () => {
  const scope = {
    boundary: [],
    smoke: [],
    integration: [],
    coverage: [],
    perf: [],
    webFlow: false,
    desktopFlow: false,
  };
  const lanes = selectLanes({
    risk: { level: 'docs', matchedLevels: ['docs'] },
    scope,
    event: 'pull_request',
  });
  assert.equal(lanes.governance, true);
  assert.equal(lanes.validate, false);
  assert.equal(lanes.web, false);
  assert.equal(lanes.integration, false);
});

test('keeps validation enabled for executable changes', () => {
  const scope = {
    boundary: [],
    smoke: [],
    integration: [],
    coverage: [],
    perf: [],
    webFlow: false,
    desktopFlow: false,
  };
  assert.equal(
    selectLanes({ risk: { level: 'package', matchedLevels: ['package'] }, scope }).validate,
    true,
  );
});

test('desktop-only changes select Desktop without Web Flow while shared UI can select both', () => {
  const desktopScope = {
    boundary: ['desktop'],
    smoke: [],
    integration: [],
    coverage: [],
    perf: [],
    webFlow: true,
    desktopFlow: true,
  };
  const desktopOnly = selectLanes({
    risk: { level: 'runtime', matchedLevels: ['runtime', 'desktop', 'package'] },
    scope: desktopScope,
    event: 'pull_request',
  });
  assert.equal(desktopOnly.validate, true);
  assert.equal(desktopOnly.web, false);

  const shared = selectLanes({
    risk: { level: 'package', matchedLevels: ['package'] },
    scope: desktopScope,
    event: 'pull_request',
  });
  assert.equal(shared.validate, true);
  assert.equal(shared.web, true);
});

test('full events enable every lane', () => {
  const lanes = selectLanes({
    risk: { level: 'docs' },
    scope: {
      boundary: [],
      smoke: [],
      integration: [],
      coverage: [],
      perf: [],
      webFlow: false,
      desktopFlow: false,
    },
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

test('explicit full main policy enables every lane even for docs risk', () => {
  const lanes = selectLanes({
    risk: { level: 'docs', matchedLevels: ['docs'] },
    scope: {
      full: true,
      boundary: [],
      smoke: [],
      integration: [],
      coverage: [],
      perf: [],
      webFlow: false,
      desktopFlow: false,
    },
    event: 'push',
    full: true,
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
