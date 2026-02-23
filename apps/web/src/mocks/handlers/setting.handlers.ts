/**
 * MSW Handlers - Setting Module
 *
 * Intercepts HTTP requests to the Setting API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import { createMockUserSetting } from '@dailyuse/contracts/mocks';

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

  // PATCH /api/v1/settings/:category — patch a category
  http.patch(`${BASE}/:category`, async ({ params, request }) => {
    const category = params.category as string;
    const patch = (await request.json()) as Record<string, unknown>;

    if (mockUserSetting.preferences && (mockUserSetting.preferences as any)[category]) {
      (mockUserSetting.preferences as any)[category] = {
        ...(mockUserSetting.preferences as any)[category],
        ...patch,
      };
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
];
