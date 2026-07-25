#!/usr/bin/env node
/**
 * Ensure `node_modules/nx/src` resolves for nx-mcp.
 *
 * Published Nx 23+ only ships compiled sources under `dist/src`, but nx-mcp
 * still hard-requires a few paths under `nx/src/...` (e.g. find-matching-projects,
 * local-plugins). Package `exports` map those correctly for bare
 * `require('nx/src/native')`, but absolute joins like
 * `join(nxRoot, 'src/utils/...')` do not.
 *
 * This creates a local symlink: node_modules/nx/src -> dist/src
 * Safe no-op when nx is missing or already linked correctly.
 */
import { existsSync, lstatSync, readlinkSync, unlinkSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const nxRoot = join(root, 'node_modules', 'nx');
const srcPath = join(nxRoot, 'src');
const distSrc = join(nxRoot, 'dist', 'src');

function log(msg) {
  console.log(`[ensure-nx-src-link] ${msg}`);
}

if (!existsSync(nxRoot)) {
  log('skip: node_modules/nx not installed');
  process.exit(0);
}

if (!existsSync(distSrc)) {
  log('skip: node_modules/nx/dist/src missing');
  process.exit(0);
}

if (existsSync(srcPath)) {
  try {
    const st = lstatSync(srcPath);
    if (st.isSymbolicLink()) {
      const target = readlinkSync(srcPath);
      if (target === 'dist/src' || target.endsWith('/dist/src') || target.endsWith('\\dist\\src')) {
        log('ok: nx/src already links to dist/src');
        process.exit(0);
      }
      unlinkSync(srcPath);
    } else if (st.isDirectory()) {
      // Real source tree (e.g. monorepo checkout of nx) — leave alone.
      log('ok: nx/src is a real directory');
      process.exit(0);
    } else {
      unlinkSync(srcPath);
    }
  } catch (err) {
    log(`warn: could not inspect existing nx/src (${err.message})`);
    process.exit(0);
  }
}

try {
  symlinkSync('dist/src', srcPath);
  log('linked node_modules/nx/src -> dist/src');
} catch (err) {
  log(`warn: failed to create symlink (${err.message})`);
  // Non-fatal: install should still succeed; MCP may partially work via exports.
  process.exit(0);
}
