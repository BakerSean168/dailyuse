/**
 * MSW Handlers - PowerSync Module
 *
 * Intercepts PowerSync token requests to prevent ETIMEDOUT errors
 * when backend is not running locally.
 */

import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/powersync`;

export const powersyncHandlers = [
  // GET /api/v1/powersync/token — return a fake PowerSync token
  http.get(`${BASE}/token`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'OK',
      data: {
        token: 'mock-powersync-token',
        expiresAt: Date.now() + 3600 * 1000,
      },
      timestamp: Date.now(),
    });
  }),
];
