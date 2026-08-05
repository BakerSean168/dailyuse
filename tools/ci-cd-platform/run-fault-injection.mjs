#!/usr/bin/env node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { evaluateOracle } from '../test-system-v2/lib/oracle.mjs';
import { createArtifactManifest } from './create-artifact-manifest.mjs';
import { buildPromotionManifest } from './promote-artifact.mjs';
import {
  digest,
  validateDeliveryManifest,
  validateFaultInjectionReport,
} from './lib/contracts.mjs';
import { restoreRuntimeClosure } from './restore-runtime-closure.mjs';
import { verifyArtifact } from './verify-artifact.mjs';

async function expectFailure(name, operation) {
  try {
    await operation();
  } catch (error) {
    return {
      name,
      observed: 'fail-closed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
  throw new Error(`fault injection scenario did not fail closed: ${name}`);
}

function artifact(name, sourceManifestDigest = 'a'.repeat(64)) {
  return {
    kind: 'artifact-manifest-v1',
    version: 1,
    name,
    commit: 'fault-sha',
    digest: 'b'.repeat(64),
    sourceManifestDigest,
    path: `dist/${name}`,
    createdBy: 'fault-injection',
    toolchain: { node: process.version },
    provenance: { workflow: 'fault-injection', runId: null, ref: null },
  };
}

export async function runFaultInjection() {
  const scenarios = [];
  scenarios.push(
    await expectFailure('detector-failure', async () => {
      const result = evaluateOracle({
        detector: 'failure',
        enabled: ['validate'],
        children: { validate: 'success' },
      });
      if (result.state !== 'detector-failure')
        throw new Error(`unexpected oracle state: ${result.state}`);
      throw new Error('detector failure is fail-closed');
    }),
  );
  scenarios.push(
    await expectFailure('cancelled-child', async () => {
      const result = evaluateOracle({
        detector: 'success',
        enabled: ['web'],
        children: { web: 'cancelled' },
      });
      if (result.state !== 'failure') throw new Error(`unexpected oracle state: ${result.state}`);
      throw new Error('cancelled child is fail-closed');
    }),
  );
  scenarios.push(
    await expectFailure('manifest-missing-field', async () =>
      validateDeliveryManifest({ kind: 'delivery-manifest-v1' }),
    ),
  );
  scenarios.push(
    await expectFailure('artifact-source-mismatch', async () =>
      buildPromotionManifest({
        artifactManifests: [artifact('api')],
        commit: 'fault-sha',
        environment: 'preview',
        promotedBy: 'fault-injection',
        output: path.join(os.tmpdir(), 'fault-promotion.json'),
        sourceManifestDigest: 'c'.repeat(64),
      }),
    ),
  );
  scenarios.push(
    await expectFailure('permission-provenance-denied', async () =>
      buildPromotionManifest({
        artifactManifests: [{ ...artifact('api'), provenance: null }],
        commit: 'fault-sha',
        environment: 'production',
        promotedBy: 'fault-injection',
        output: path.join(os.tmpdir(), 'fault-permission.json'),
      }),
    ),
  );

  const root = await mkdtemp(path.join(os.tmpdir(), 'memoflow-fault-injection-'));
  try {
    const target = path.join(root, 'api-dist');
    await mkdir(target, { recursive: true });
    const artifactManifest = path.join(root, 'api-artifact-manifest.json');
    await writeFile(path.join(target, 'main.js'), 'original\n');
    await createArtifactManifest({
      name: 'api',
      target,
      commit: 'fault-sha',
      sourceManifestDigest: 'a'.repeat(64),
      output: artifactManifest,
      createdBy: 'fault-injection',
    });
    await writeFile(path.join(target, 'main.js'), 'tampered\n');
    scenarios.push(
      await expectFailure('artifact-content-mismatch', async () =>
        verifyArtifact({
          manifestFile: artifactManifest,
          target,
        }),
      ),
    );

    const staged = path.join(root, 'staged-closure', 'packages', 'alpha', 'dist');
    await mkdir(staged, { recursive: true });
    await writeFile(path.join(staged, 'index.js'), 'export {}\n');
    const workspace = path.join(root, 'workspace');
    await mkdir(path.join(workspace, 'packages', 'alpha'), { recursive: true });
    await writeFile(
      path.join(workspace, 'packages', 'alpha', 'package.json'),
      JSON.stringify({ name: '@memoflow/alpha' }),
    );
    const closureManifest = path.join(root, 'closure-manifest.json');
    const closure = await createArtifactManifest({
      name: 'api-runtime-closure',
      target: path.join(root, 'staged-closure'),
      commit: 'fault-sha',
      sourceManifestDigest: 'a'.repeat(64),
      output: closureManifest,
      createdBy: 'fault-injection',
      entries: [{ name: '@memoflow/alpha', path: 'packages/alpha/dist' }],
    });
    await rm(staged, { recursive: true, force: true });
    scenarios.push(
      await expectFailure('runtime-closure-entry-missing', async () =>
        restoreRuntimeClosure({
          manifestFile: closureManifest,
          sourceArg: path.join(root, 'staged-closure'),
          workspaceArg: workspace,
          sourceManifestDigest: closure.sourceManifestDigest,
        }),
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }

  const report = {
    kind: 'fault-injection-report-v1',
    version: 1,
    status: 'passed',
    scenarios,
    provenance: {
      generator: 'ci-cd-platform-v2/run-fault-injection@1',
      runId: process.env.GITHUB_RUN_ID ?? null,
    },
  };
  report.digest = digest(report);
  validateFaultInjectionReport(report);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = path.resolve(
    process.argv[2] ?? 'reports/ci-cd-platform/fault-injection-report-v1.json',
  );
  runFaultInjection()
    .then(async (report) => {
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
      console.log(
        JSON.stringify(
          { path: output, scenarios: report.scenarios.length, digest: report.digest },
          null,
          2,
        ),
      );
    })
    .catch((error) => {
      console.error(`[fault-injection] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}
