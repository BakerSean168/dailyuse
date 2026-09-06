#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createLaneInput } from './create-lane-input.mjs';
import { digest, validateDeliveryManifest, validateWorkspaceReceipt } from './lib/contracts.mjs';
import { getLaneDefinition } from './lib/registry.mjs';

export async function prepareSharedLanes({ manifest, receipt, lanes, outputDir }) {
  validateDeliveryManifest(manifest);
  validateWorkspaceReceipt(receipt);
  const requestedLanes = [...new Set(lanes)];
  for (const lane of requestedLanes) getLaneDefinition(lane);
  const enabled = requestedLanes.filter((lane) => manifest.lanes[lane]);
  if (enabled.length === 0) throw new Error('shared lane runner has no enabled lanes');
  await mkdir(outputDir, { recursive: true });
  const setupMs = receipt.timing?.setupMs ?? 0;
  const setupShare = Math.floor(setupMs / enabled.length);
  const setupRemainder = setupMs % enabled.length;
  for (const [index, lane] of enabled.entries()) {
    await createLaneInput({
      lane,
      manifest,
      output: path.join(outputDir, `${lane}-input-v1.json`),
    });
    const laneReceipt = {
      ...receipt,
      timing: {
        ...receipt.timing,
        setupMs: setupShare + (index < setupRemainder ? 1 : 0),
      },
      sharedWorkspace: { lane, lanes: enabled, laneCount: enabled.length },
    };
    delete laneReceipt.digest;
    laneReceipt.digest = digest(laneReceipt);
    validateWorkspaceReceipt(laneReceipt);
    await writeFile(
      path.join(outputDir, `${lane}-workspace-receipt.json`),
      `${JSON.stringify(laneReceipt, null, 2)}\n`,
    );
  }
  return enabled;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    args.set(process.argv[index].replace(/^--/u, ''), process.argv[index + 1]);
  }
  const manifestPath = path.resolve(args.get('manifest') ?? 'scope/delivery-manifest-v1.json');
  const receiptPath = path.resolve(
    args.get('receipt') ?? 'reports/ci-cd-platform/workspace-receipt.json',
  );
  const lanes = (args.get('lanes') ?? '').split(',').filter(Boolean);
  if (lanes.length === 0) throw new Error('--lanes is required');
  const outputDir = path.resolve(args.get('output') ?? 'reports/ci-cd-platform');
  const enabled = await prepareSharedLanes({
    manifest: JSON.parse(await readFile(manifestPath, 'utf8')),
    receipt: JSON.parse(await readFile(receiptPath, 'utf8')),
    lanes,
    outputDir,
  });
  console.log(JSON.stringify({ enabled, outputDir }, null, 2));
}
