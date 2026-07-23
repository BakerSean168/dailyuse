/**
 * Residual 1041: sole Playwright globalSetup that builds desktop once for e2e suites.
 * Exact dual retired from e2e/sync + e2e/desktop-screenshots global-setup files.
 * Soft residual: e2e/shell/global-setup keeps skip-build gate (keep-boundary wrapper).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDesktopApp } from './build-desktop';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');

export async function runDesktopBuildGlobalSetup(): Promise<void> {
  buildDesktopApp(workspaceRoot);
}

export default runDesktopBuildGlobalSetup;
