/**
 * MSW Handlers - Setting Module
 *
 * Intercepts HTTP requests to the Setting API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import {
  createMockUserSetting,
  createMockAppConfig,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/settings`;

let mockUserSetting = createMockUserSetting();

export const settingHandlers = [
  // GET /api/v1/settings — get user settings
  http.get(BASE, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: mockUserSetting,
      timestamp: Date.now(),
    });
  }),

  // PUT /api/v1/settings — update user settings (category-based)
  http.put(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    // Merge category-level partial updates into mock
    for (const category of ['appearance', 'locale', 'workflow', 'privacy', 'notification', 'editor', 'shortcuts', 'experimental', 'ui'] as const) {
      if (body[category] && typeof body[category] === 'object') {
        (mockUserSetting as any)[category] = {
          ...(mockUserSetting as any)[category],
          ...(body[category] as Record<string, unknown>),
        };
      }
    }
    mockUserSetting = { ...mockUserSetting, updatedAt: Date.now() };

    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: mockUserSetting,
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/settings/reset — reset user settings
  http.post(`${BASE}/reset`, () => {
    mockUserSetting = createMockUserSetting();
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Reset',
      data: mockUserSetting,
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/settings/defaults — get default settings
  http.get(`${BASE}/defaults`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockUserSetting(),
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/settings/app-config — get app config
  http.get(`${BASE}/app-config`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockAppConfig(),
      timestamp: Date.now(),
    });
  }),
];
