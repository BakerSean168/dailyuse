/**
 * Desktop renderer entry dispatcher.
 *
 * Keep startup tiny so `#/auth` can boot without paying for the entire
 * authenticated renderer shell.
 */
import { applyDocumentIcons, logo128, logoIco } from '@dailyuse/assets';

import './styles/index.css';
// Residual 941: host bridge via ensureElectronBridgeAvailable sole helper.
import { ensureElectronBridgeAvailable } from './platform/electron-bridge';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

function renderStartupError(error: unknown): void {
  console.error('[DesktopRenderer] Unhandled renderer error', error);

  const mountTarget = document.querySelector('#app');
  if (!mountTarget) {
    return;
  }

  mountTarget.innerHTML = `
    <div style="height:100%;display:flex;align-items:center;justify-content:center;padding:24px;background:#111827;color:#f9fafb;font-family:system-ui,sans-serif;">
      <div style="max-width:720px;">
        <h1 style="margin:0 0 12px;font-size:20px;">Desktop renderer failed</h1>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#1f2937;padding:12px;border-radius:8px;overflow:auto;">${escapeHtml(
          formatError(error),
        )}</pre>
      </div>
    </div>
  `;
}


function getHashPath(): string {
  const hash = window.location.hash;
  const rawPath = hash.startsWith('#') ? hash.slice(1) : hash;
  const [path = '/'] = rawPath.split(/[?#]/, 1);
  return path || '/';
}

function isAuthHashRoute(path: string): boolean {
  return path === '/auth' || path.startsWith('/auth/');
}

async function startRenderer() {
  applyDocumentIcons({
    faviconHref: logoIco,
    appleTouchIconHref: logo128,
  });

  window.addEventListener('error', (event) => {
    renderStartupError(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    renderStartupError(event.reason);
  });

  ensureElectronBridgeAvailable();

  if (isAuthHashRoute(getHashPath())) {
    const { bootstrapAuthApp } = await import('./bootstrap/auth');
    await bootstrapAuthApp();
    return;
  }

  const { bootstrapMainApp } = await import('./bootstrap/app');
  await bootstrapMainApp();
}

startRenderer().catch((error) => {
  renderStartupError(error);
});
