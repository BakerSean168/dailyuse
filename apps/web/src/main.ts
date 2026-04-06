/**
 * Web entry dispatcher.
 *
 * Keep the initial entry tiny so `/auth` can boot without downloading the
 * full authenticated application shell.
 */

import { applyDocumentIcons, logo128, logoIco } from '@dailyuse/assets';

import './styles/index.css';

// Polyfill crypto.randomUUID for non-secure contexts
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: string) =>
      (
        Number(c) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
      ).toString(16),
    ) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

function isAuthRoute(pathname: string): boolean {
  return pathname === '/auth' || pathname.startsWith('/auth/');
}

async function startMockWorkerIfEnabled() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_API === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

async function startApp() {
  applyDocumentIcons({
    faviconHref: logoIco,
    appleTouchIconHref: logo128,
  });

  await startMockWorkerIfEnabled();

  if (isAuthRoute(window.location.pathname)) {
    const { bootstrapAuthApp } = await import('./bootstrap/auth');
    await bootstrapAuthApp();
    return;
  }

  const { bootstrapMainApp } = await import('./bootstrap/app');
  await bootstrapMainApp();
}

void startApp();
