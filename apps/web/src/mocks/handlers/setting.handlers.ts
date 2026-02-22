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
  createMockAppConfigList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/settings`;

let mockUserSetting = createMockUserSetting();

export const settingHandlers = [
  // GET /api/v1/settings/user — get user settings
  http.get(`${BASE}/user`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: mockUserSetting,
      timestamp: Date.now(),
    });
  }),

  // PUT /api/v1/settings/user — update user settings
  http.put(`${BASE}/user`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (body.entries && typeof body.entries === 'string') {
      mockUserSetting = {
        ...mockUserSetting,
        entries: body.entries,
        updatedAt: Date.now(),
      };
    }

    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: mockUserSetting,
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/settings/app-config — get app config
  http.get(`${BASE}/app-config`, () => {
    const configs = createMockAppConfigList(10);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: configs,
      timestamp: Date.now(),
    });
  }),

  // PUT /api/v1/settings/app-config/:key — update app config
  http.put(`${BASE}/app-config/:key`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockAppConfig({
        key: params.key as string,
        value: body.value,
      }),
      timestamp: Date.now(),
    });
  }),
];
