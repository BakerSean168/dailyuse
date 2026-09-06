import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  resolveDesktopSigningState,
  validateMacosSigningCredentials,
} from '../release-tools/macos-signing-policy.mjs';
import {
  createNotarytoolSubmitArgs,
  validateNotarytoolResult,
} from '../release-tools/notarize-macos-dmg.mjs';
import {
  createMacosTrustReceipt,
  validateMacosTrustObservation,
  validateMacosTrustReceipt,
} from '../release-tools/verify-macos-trust.mjs';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, '../../..');
const authority = 'Developer ID Application: MemoFlow Example (ABCDEF1234)';
const validObservationInput = {
  platform: 'macos-arm64',
  arch: 'arm64',
  appCodesignOutput:
    'Executable=/tmp/MemoFlow.app/Contents/MacOS/memoflow\n' +
    `Authority=${authority}\n` +
    'TeamIdentifier=ABCDEF1234\n' +
    'flags=0x10000(runtime)\n',
  appStaplerOutput: 'Processing: MemoFlow.app\nThe validate action worked!',
  appGatekeeperOutput: `MemoFlow.app: accepted\nsource=Notarized Developer ID\norigin=${authority}`,
  binaryArchitectures: 'arm64',
  dmgCodesignOutput: `Executable=/tmp/MemoFlow.dmg\nAuthority=${authority}\n`,
  dmgStaplerOutput: 'Processing: MemoFlow.dmg\nThe validate action worked!',
  dmgGatekeeperOutput: `MemoFlow.dmg: accepted\nsource=Notarized Developer ID\norigin=${authority}`,
};

function validCredentials(overrides = {}) {
  return {
    cscLink: 'base64-certificate',
    appleApiKeyP8: '-----BEGIN PRIVATE KEY-----\nfixture\n-----END PRIVATE KEY-----',
    appleApiKeyId: 'A1B2C3D4E5',
    appleApiIssuer: '12345678-1234-1234-1234-123456789abc',
    ...overrides,
  };
}

test('macOS signing policy CLI emits explicit Windows step outputs', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'memoflow-signing-policy-'));
  try {
    const output = path.join(temp, 'github-output.txt');
    execFileSync(
      process.execPath,
      [
        path.join(repoRoot, 'tools/ci-cd-platform/release-tools/macos-signing-policy.mjs'),
        'resolve',
        'windows',
        'unsigned',
        'unsigned-pilot',
      ],
      { env: { ...process.env, GITHUB_OUTPUT: output }, stdio: 'pipe' },
    );
    const values = Object.fromEntries(
      (await readFile(output, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => line.split('=', 2)),
    );
    assert.equal(values.signing_state, 'unsigned');
    assert.equal(values.signed_mode, 'false');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('macOS signing policy preserves non-macOS state and accepts only explicit pilot/signed modes', () => {
  assert.equal(
    resolveDesktopSigningState({ os: 'windows', matrixState: 'unsigned', macosMode: 'bad' }),
    'unsigned',
  );
  assert.equal(
    resolveDesktopSigningState({
      os: 'macos',
      matrixState: 'macos-policy',
      macosMode: 'unsigned-pilot',
    }),
    'unsigned-pilot',
  );
  assert.equal(
    resolveDesktopSigningState({
      os: 'macos',
      matrixState: 'macos-policy',
      macosMode: 'signed-notarized',
    }),
    'signed-notarized',
  );
  assert.throws(
    () =>
      resolveDesktopSigningState({ os: 'macos', matrixState: 'macos-policy', macosMode: 'signed' }),
    /unsupported macOS signing mode/,
  );
});

test('signed-notarized credentials fail closed on missing or malformed protected inputs', () => {
  assert.doesNotThrow(() => validateMacosSigningCredentials(validCredentials()));
  assert.throws(
    () => validateMacosSigningCredentials(validCredentials({ cscLink: '' })),
    /MACOS_CSC_LINK/,
  );
  assert.throws(
    () => validateMacosSigningCredentials(validCredentials({ appleApiKeyP8: 'not-a-key' })),
    /private key/,
  );
  assert.throws(
    () => validateMacosSigningCredentials(validCredentials({ appleApiKeyId: 'short' })),
    /10-character/,
  );
  assert.throws(
    () => validateMacosSigningCredentials(validCredentials({ appleApiIssuer: 'not-a-uuid' })),
    /issuer UUID/,
  );
});

test('DMG notarization uses App Store Connect key auth and requires Accepted notary evidence', () => {
  assert.deepEqual(
    createNotarytoolSubmitArgs({
      dmg: '/tmp/MemoFlow.dmg',
      keyPath: '/tmp/AuthKey_A1B2C3D4E5.p8',
      keyId: 'A1B2C3D4E5',
      issuer: '12345678-1234-1234-1234-123456789abc',
    }),
    [
      'notarytool',
      'submit',
      '/tmp/MemoFlow.dmg',
      '--key',
      '/tmp/AuthKey_A1B2C3D4E5.p8',
      '--key-id',
      'A1B2C3D4E5',
      '--issuer',
      '12345678-1234-1234-1234-123456789abc',
      '--wait',
      '--output-format',
      'json',
    ],
  );
  assert.deepEqual(validateNotarytoolResult('{"id":"submission-1","status":"Accepted"}'), {
    id: 'submission-1',
    status: 'Accepted',
  });
  assert.throws(
    () => validateNotarytoolResult('{"id":"submission-2","status":"Invalid"}'),
    /not accepted/,
  );
  assert.throws(() => validateNotarytoolResult('not-json'), /valid JSON/);
});

test('trust observation requires notarized Developer ID proof for both application and DMG', () => {
  const evidence = validateMacosTrustObservation(validObservationInput);
  assert.equal(evidence.teamIdentifier, 'ABCDEF1234');
  assert.equal(evidence.expectedArchitecture, 'arm64');
  assert.equal(evidence.appAuthority, authority);
  assert.equal(evidence.dmgAuthority, authority);
  assert.throws(
    () =>
      validateMacosTrustObservation({
        ...validObservationInput,
        appGatekeeperOutput: 'MemoFlow.app: accepted\nsource=Developer ID',
      }),
    /Gatekeeper/,
  );
  assert.throws(
    () =>
      validateMacosTrustObservation({
        ...validObservationInput,
        appCodesignOutput: validObservationInput.appCodesignOutput.replace('(runtime)', ''),
      }),
    /hardened runtime/,
  );
  assert.throws(
    () =>
      validateMacosTrustObservation({
        ...validObservationInput,
        appStaplerOutput: 'ticket missing',
      }),
    /notarization ticket/,
  );
  assert.throws(
    () =>
      validateMacosTrustObservation({ ...validObservationInput, binaryArchitectures: 'x86_64' }),
    /arm64/,
  );
  assert.throws(
    () =>
      validateMacosTrustObservation({
        ...validObservationInput,
        dmgCodesignOutput: 'Authority=Developer ID Application: Other Publisher (ZZZZZZ9999)\n',
      }),
    /does not match/,
  );
  assert.throws(
    () =>
      validateMacosTrustObservation({
        ...validObservationInput,
        dmgGatekeeperOutput: 'MemoFlow.dmg: accepted\nsource=Developer ID',
      }),
    /Gatekeeper/,
  );
});

test('signed trust receipt is self-digested and rejects forged app or disk-image trust', () => {
  const observation = validateMacosTrustObservation(validObservationInput);
  const receipt = createMacosTrustReceipt({
    platform: 'macos-arm64',
    arch: 'arm64',
    appBundle: 'MemoFlow.app',
    dmg: 'MemoFlow-macOS-arm64-1.2.3.dmg',
    observation,
  });
  assert.equal(validateMacosTrustReceipt(receipt).status, 'passed');
  assert.match(receipt.digest, /^[a-f0-9]{64}$/u);
  assert.throws(() => validateMacosTrustReceipt({ ...receipt, status: 'failed' }), /passed state/);
  assert.throws(
    () =>
      validateMacosTrustReceipt({
        ...receipt,
        diskImage: {
          ...receipt.diskImage,
          gatekeeper: { status: 'passed', source: 'Developer ID' },
        },
      }),
    /DMG Gatekeeper proof/,
  );
});

test('signed electron-builder overlay inherits release identity and forces app plus DMG trust controls', async () => {
  const { getConfig } = require('app-builder-lib/out/util/config/config');
  const config = await getConfig(
    path.join(repoRoot, 'apps/desktop'),
    'electron-builder.macos-signed.json5',
    null,
  );
  assert.equal(config.forceCodeSigning, true);
  assert.equal(config.mac.hardenedRuntime, true);
  assert.equal(config.mac.notarize, true);
  assert.equal(config.mac.gatekeeperAssess, false);
  assert.equal(config.mac.type, 'distribution');
  assert.equal(config.mac.category, 'public.app-category.productivity');
  assert.match(config.mac.artifactName, /macOS/);
  assert.equal(config.dmg.sign, true);
  assert.equal(config.dmg.writeUpdateInfo, false);
});

test('desktop receipt refuses signed-notarized claim without verified app plus DMG trust receipt', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'memoflow-signed-receipt-'));
  const receiptTool = path.join(
    repoRoot,
    'tools/ci-cd-platform/release-tools/write-desktop-platform-receipt.mjs',
  );
  const gitSha = 'a'.repeat(40);
  try {
    await writeFile(path.join(root, 'MemoFlow-macOS-arm64-1.2.3.dmg'), 'dmg');
    await writeFile(path.join(root, 'MemoFlow-macOS-arm64-1.2.3.zip'), 'zip');
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            receiptTool,
            root,
            'macos-arm64',
            'macos',
            'arm64',
            'signed-notarized',
            'v1.2.3',
            gitSha,
            'passed',
            'packaged-electron-playwright',
            'packaged-app',
          ],
          { cwd: repoRoot, stdio: 'pipe' },
        ),
      /status 1|Command failed/u,
    );

    const observation = validateMacosTrustObservation(validObservationInput);
    const trust = createMacosTrustReceipt({
      platform: 'macos-arm64',
      arch: 'arm64',
      appBundle: 'MemoFlow.app',
      dmg: 'MemoFlow-macOS-arm64-1.2.3.dmg',
      observation,
    });
    const trustPath = path.join(root, 'macos-trust-receipt.json');
    await writeFile(trustPath, `${JSON.stringify(trust, null, 2)}\n`);
    execFileSync(
      process.execPath,
      [
        receiptTool,
        root,
        'macos-arm64',
        'macos',
        'arm64',
        'signed-notarized',
        'v1.2.3',
        gitSha,
        'passed',
        'packaged-electron-playwright',
        'packaged-app',
        trustPath,
      ],
      { cwd: repoRoot },
    );
    const platformReceipt = JSON.parse(
      await readFile(path.join(root, 'desktop-platform-receipt.json'), 'utf8'),
    );
    assert.equal(platformReceipt.signingState, 'signed-notarized');
    assert.equal(platformReceipt.trustValidation.application.gatekeeper.status, 'passed');
    assert.equal(platformReceipt.trustValidation.diskImage.gatekeeper.status, 'passed');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
