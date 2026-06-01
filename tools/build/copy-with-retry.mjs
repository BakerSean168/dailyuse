/**
 * Copy a directory with retry logic for Windows file lock resilience.
 *
 * Usage: node tools/build/copy-with-retry.mjs <src> <dest>
 *
 * Retries up to 5 times with 500ms delay on EPERM/EBUSY/ENOTEMPTY errors.
 */

import fs from 'node:fs';
import path from 'node:path';

const [src, dest] = process.argv.slice(2);

if (!src || !dest) {
  console.error('Usage: copy-with-retry.mjs <src> <dest>');
  process.exit(1);
}

const MAX_RETRIES = 5;
const DELAY_MS = 500;

const RETRYABLE = new Set(['EPERM', 'EBUSY', 'ENOTEMPTY', 'EBUSY']);

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    console.log(`✅ Copied ${src} → ${dest}`);
    process.exit(0);
  } catch (err) {
    if (RETRYABLE.has(err.code) && attempt < MAX_RETRIES) {
      console.warn(
        `⚠️  Copy failed (${err.code}), retrying in ${DELAY_MS}ms (attempt ${attempt}/${MAX_RETRIES})...`,
      );
      // Busy-wait is acceptable for a short delay in a build script
      const start = Date.now();
      while (Date.now() - start < DELAY_MS) {
        /* spin */
      }
    } else {
      console.error(`❌ Copy failed after ${attempt} attempt(s): ${err.message}`);
      process.exit(1);
    }
  }
}
