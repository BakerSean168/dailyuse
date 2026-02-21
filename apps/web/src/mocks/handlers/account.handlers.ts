/**
 * MSW Handlers - Account Module
 *
 * Intercepts HTTP requests to the Account API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import { createMockAccount } from '@dailyuse/contracts/mocks';

const BASE = '/api/v1/account';

// Shared mock account (persists updates within a browser session)
let mockAccount = createMockAccount();

export const accountHandlers = [
  // GET /api/v1/account — get current account
  http.get(BASE, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: mockAccount,
      timestamp: Date.now(),
    });
  }),

  // PATCH /api/v1/account — update account profile
  http.patch(BASE, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    mockAccount = {
      ...mockAccount,
      profile: {
        ...mockAccount.profile,
        ...(body as object),
      },
      updatedAt: Date.now(),
    };
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: mockAccount,
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/account/settings — get account settings
  http.get(`${BASE}/settings`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: mockAccount.settings,
      timestamp: Date.now(),
    });
  }),

  // PATCH /api/v1/account/settings — update account settings
  http.patch(`${BASE}/settings`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    mockAccount = {
      ...mockAccount,
      settings: {
        ...mockAccount.settings,
        ...(body as object),
      },
      updatedAt: Date.now(),
    };
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: mockAccount.settings,
      timestamp: Date.now(),
    });
  }),
];
