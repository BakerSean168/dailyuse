#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PLATFORM_ARCH = Object.freeze({ 'macos-x64': 'x86_64', 'macos-arm64': 'arm64' });
const NOTARIZED_SOURCE = 'Notarized Developer ID';

function stableDigest(value) {
  const keys = (entry) => {
    if (Array.isArray(entry)) return entry.map(keys);
    if (entry && typeof entry === 'object') {
      return Object.fromEntries(
        Object.keys(entry)
          .sort()
          .map((key) => [key, keys(entry[key])]),
      );
    }
    return entry;
  };
  return createHash('sha256')
    .update(JSON.stringify(keys(value)))
    .digest('hex');
}

function requireGatekeeper(output, subject) {
  if (!/accepted/iu.test(output) || !/source=Notarized Developer ID/iu.test(output)) {
    throw new Error(`Gatekeeper did not accept notarized Developer ID ${subject}`);
  }
}

function requireStapler(output, subject) {
  if (!/The validate action worked|validated/iu.test(output)) {
    throw new Error(`${subject} stapled notarization ticket was not validated`);
  }
}

function developerIdAuthority(output, subject) {
  const authority = output.match(/^Authority=(Developer ID Application: .+)$/mu)?.[1];
  if (!authority) {
    throw new Error(
      `Developer ID Application authority is missing from ${subject} codesign evidence`,
    );
  }
  return authority;
}

export function validateMacosTrustObservation({
  platform,
  arch,
  appCodesignOutput,
  appStaplerOutput,
  appGatekeeperOutput,
  binaryArchitectures,
  dmgCodesignOutput,
  dmgStaplerOutput,
  dmgGatekeeperOutput,
}) {
  const expectedArchitecture = PLATFORM_ARCH[platform];
  if (!expectedArchitecture) throw new Error(`unsupported macOS trust platform: ${platform}`);
  if (arch !== (platform === 'macos-x64' ? 'x64' : 'arm64')) {
    throw new Error(`macOS trust platform/arch mismatch: ${platform}/${arch}`);
  }

  const appAuthority = developerIdAuthority(appCodesignOutput, 'application');
  const teamIdentifier = appCodesignOutput.match(/^TeamIdentifier=([A-Z0-9]{10})$/mu)?.[1];
  if (!teamIdentifier)
    throw new Error('TeamIdentifier is missing from application codesign evidence');
  if (!/flags=.*\bruntime\b/mu.test(appCodesignOutput)) {
    throw new Error('hardened runtime flag is missing from application codesign evidence');
  }
  requireStapler(appStaplerOutput, 'application');
  requireGatekeeper(appGatekeeperOutput, 'application');

  const architectures = new Set(binaryArchitectures.trim().split(/\s+/u).filter(Boolean));
  if (!architectures.has(expectedArchitecture)) {
    throw new Error(
      `packaged executable does not contain expected architecture ${expectedArchitecture}`,
    );
  }

  const dmgAuthority = developerIdAuthority(dmgCodesignOutput, 'DMG');
  if (dmgAuthority !== appAuthority) {
    throw new Error('DMG Developer ID authority does not match the application authority');
  }
  requireStapler(dmgStaplerOutput, 'DMG');
  requireGatekeeper(dmgGatekeeperOutput, 'DMG');

  return { appAuthority, dmgAuthority, teamIdentifier, expectedArchitecture };
}

export function createMacosTrustReceipt({ platform, arch, appBundle, dmg, observation }) {
  const receipt = {
    schemaVersion: 1,
    kind: 'macos-trust-receipt',
    platform,
    arch,
    signingState: 'signed-notarized',
    status: 'passed',
    appBundle,
    dmg,
    application: {
      codesign: {
        status: 'passed',
        authority: observation.appAuthority,
        teamIdentifier: observation.teamIdentifier,
      },
      hardenedRuntime: { status: 'passed' },
      notarization: { status: 'passed', stapled: true },
      gatekeeper: { status: 'passed', source: NOTARIZED_SOURCE },
      architecture: { status: 'passed', executable: observation.expectedArchitecture },
    },
    diskImage: {
      codesign: {
        status: 'passed',
        authority: observation.dmgAuthority,
        matchesApplicationAuthority: true,
      },
      notarization: { status: 'passed', stapled: true },
      gatekeeper: { status: 'passed', source: NOTARIZED_SOURCE },
    },
    provenance: { verifier: 'ci-cd-platform-v3/verify-macos-trust@1' },
  };
  receipt.digest = stableDigest(receipt);
  validateMacosTrustReceipt(receipt);
  return receipt;
}

export function validateMacosTrustReceipt(receipt) {
  if (receipt?.schemaVersion !== 1 || receipt.kind !== 'macos-trust-receipt') {
    throw new Error('invalid macOS trust receipt identity');
  }
  if (!PLATFORM_ARCH[receipt.platform]) {
    throw new Error(`unsupported macOS trust receipt platform: ${receipt.platform}`);
  }
  if (receipt.signingState !== 'signed-notarized' || receipt.status !== 'passed') {
    throw new Error('macOS trust receipt must prove signed-notarized passed state');
  }
  if (receipt.arch !== (receipt.platform === 'macos-x64' ? 'x64' : 'arm64')) {
    throw new Error('macOS trust receipt architecture mismatch');
  }
  if (typeof receipt.appBundle !== 'string' || !receipt.appBundle.endsWith('.app')) {
    throw new Error('macOS trust receipt app bundle identity is invalid');
  }
  if (typeof receipt.dmg !== 'string' || !receipt.dmg.endsWith('.dmg')) {
    throw new Error('macOS trust receipt DMG identity is invalid');
  }

  const app = receipt.application;
  if (!app?.codesign?.authority?.startsWith('Developer ID Application: ')) {
    throw new Error('macOS trust receipt lacks application Developer ID authority');
  }
  if (!/^[A-Z0-9]{10}$/u.test(app.codesign?.teamIdentifier ?? '')) {
    throw new Error('macOS trust receipt TeamIdentifier is invalid');
  }
  if (app.hardenedRuntime?.status !== 'passed') {
    throw new Error('macOS trust receipt lacks hardened runtime proof');
  }
  if (app.notarization?.status !== 'passed' || app.notarization?.stapled !== true) {
    throw new Error('macOS trust receipt lacks application stapled notarization proof');
  }
  if (app.gatekeeper?.status !== 'passed' || app.gatekeeper?.source !== NOTARIZED_SOURCE) {
    throw new Error('macOS trust receipt lacks application Gatekeeper proof');
  }
  if (
    app.architecture?.status !== 'passed' ||
    app.architecture?.executable !== PLATFORM_ARCH[receipt.platform]
  ) {
    throw new Error('macOS trust receipt lacks application architecture proof');
  }

  const dmg = receipt.diskImage;
  if (!dmg?.codesign?.authority?.startsWith('Developer ID Application: ')) {
    throw new Error('macOS trust receipt lacks DMG Developer ID authority');
  }
  if (
    dmg.codesign.authority !== app.codesign.authority ||
    dmg.codesign.matchesApplicationAuthority !== true
  ) {
    throw new Error('macOS trust receipt DMG authority does not match application authority');
  }
  if (dmg.notarization?.status !== 'passed' || dmg.notarization?.stapled !== true) {
    throw new Error('macOS trust receipt lacks DMG stapled notarization proof');
  }
  if (dmg.gatekeeper?.status !== 'passed' || dmg.gatekeeper?.source !== NOTARIZED_SOURCE) {
    throw new Error('macOS trust receipt lacks DMG Gatekeeper proof');
  }

  const unsigned = { ...receipt };
  delete unsigned.digest;
  if (receipt.digest !== stableDigest(unsigned)) {
    throw new Error('macOS trust receipt digest mismatch');
  }
  return receipt;
}

async function findBySuffix(root, suffix) {
  const found = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name.endsWith(suffix)) found.push(absolute);
      else if (entry.isDirectory()) await walk(absolute);
    }
  }
  await walk(root);
  return found;
}

async function findFiles(root, extension) {
  return (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => path.join(root, entry.name));
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status ?? 1}): ${output}`);
  }
  return output;
}

async function main() {
  const [root, platform, arch, outputFile] = process.argv.slice(2);
  if (!root || !platform || !arch || !outputFile) {
    throw new Error('usage: verify-macos-trust.mjs <dist-root> <platform> <arch> <output>');
  }
  if (process.platform !== 'darwin') {
    throw new Error('macOS trust verification must run on a macOS runner');
  }
  const apps = await findBySuffix(root, '.app');
  if (apps.length !== 1) {
    throw new Error(`expected exactly one packaged .app under ${root}, found ${apps.length}`);
  }
  const dmgs = await findFiles(root, '.dmg');
  if (dmgs.length !== 1) {
    throw new Error(`expected exactly one DMG under ${root}, found ${dmgs.length}`);
  }
  const app = apps[0];
  const dmg = dmgs[0];
  const executable = path.join(app, 'Contents', 'MacOS', 'memoflow');

  run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
  const appCodesignOutput = run('codesign', ['--display', '--verbose=4', app]);
  const appStaplerOutput = run('xcrun', ['stapler', 'validate', '-v', app]);
  const appGatekeeperOutput = run('spctl', ['--assess', '--type', 'execute', '--verbose=4', app]);
  const binaryArchitectures = run('lipo', ['-archs', executable]);

  run('codesign', ['--verify', '--strict', '--verbose=2', dmg]);
  const dmgCodesignOutput = run('codesign', ['--display', '--verbose=4', dmg]);
  const dmgStaplerOutput = run('xcrun', ['stapler', 'validate', '-v', dmg]);
  const dmgGatekeeperOutput = run('spctl', [
    '--assess',
    '--type',
    'open',
    '--context',
    'context:primary-signature',
    '--verbose=4',
    dmg,
  ]);

  const observation = validateMacosTrustObservation({
    platform,
    arch,
    appCodesignOutput,
    appStaplerOutput,
    appGatekeeperOutput,
    binaryArchitectures,
    dmgCodesignOutput,
    dmgStaplerOutput,
    dmgGatekeeperOutput,
  });
  const receipt = createMacosTrustReceipt({
    platform,
    arch,
    appBundle: path.basename(app),
    dmg: path.basename(dmg),
    observation,
  });
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(
    `[verify-macos-trust] PASS ${platform} team=${observation.teamIdentifier} app+dmg digest=${receipt.digest}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`[verify-macos-trust] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
