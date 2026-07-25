/**
 * Residual 1041 soft keep-boundary: shell e2e may skip rebuild via SHELL_E2E_SKIP_BUILD.
 * Desktop build body is sole in e2e/helpers/desktop-build-global-setup.ts.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDesktopBuildGlobalSetup } from '../helpers/desktop-build-global-setup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
const desktopMainEntrypoint = path.join(
  workspaceRoot,
  'apps',
  'desktop',
  'dist-electron',
  'main.cjs',
);

export default async function globalSetup(): Promise<void> {
  // Always rebuild so shell testids and latest app-vue land in the Electron bundle.
  // Set SHELL_E2E_SKIP_BUILD=1 to reuse an existing dist when iterating on assertions only.
  if (process.env.SHELL_E2E_SKIP_BUILD === '1' && existsSync(desktopMainEntrypoint)) {
    return;
  }
  await runDesktopBuildGlobalSetup();
}
