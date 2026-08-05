#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import {
  validateArtifactManifest,
  validateDeliveryManifest,
  validateLaneInput,
  validateLaneResult,
} from './lib/contracts.mjs';

const validators = {
  delivery: validateDeliveryManifest,
  'lane-input': validateLaneInput,
  'lane-result': validateLaneResult,
  artifact: validateArtifactManifest,
};

export async function validateFile(file, kind) {
  const value = JSON.parse(await readFile(file, 'utf8'));
  const validator = validators[kind] ?? validators[value.kind?.replace(/-v\d+$/u, '')];
  if (!validator) throw new Error(`No validator for ${kind ?? value.kind}`);
  return validator(value);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, kind] = process.argv.slice(2);
  if (!file)
    throw new Error(
      'Usage: validate-manifest.mjs <file> [delivery|lane-input|lane-result|artifact]',
    );
  validateFile(file, kind)
    .then(() => console.log(`[contract] valid: ${file}`))
    .catch((error) => {
      console.error(
        `[contract] invalid: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exitCode = 1;
    });
}
