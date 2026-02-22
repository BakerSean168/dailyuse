/**
 * MSW Handlers - Reminder Module
 *
 * Intercepts HTTP requests to the Reminder API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import {
  createMockReminderTemplate,
  createMockReminderTemplateList,
  createMockReminderGroup,
  createMockReminderGroupList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TEMPLATES_BASE = `${API_BASE}/reminder-templates`;
const GROUPS_BASE = `${API_BASE}/reminder-groups`;

export const reminderHandlers = [
  // ============ Templates ============

  // GET /api/v1/reminder-templates — list templates
  http.get(TEMPLATES_BASE, () => {
    const templates = createMockReminderTemplateList(10);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: templates,
      total: templates.length,
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/reminder-templates/:id — get single template
  http.get(`${TEMPLATES_BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockReminderTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/reminder-templates — create template
  http.post(TEMPLATES_BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockReminderTemplate({ name: body.name as string }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // PUT /api/v1/reminder-templates/:id — update template
  http.put(`${TEMPLATES_BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockReminderTemplate({
        id: params.id as string,
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/reminder-templates/:id — delete template
  http.delete(`${TEMPLATES_BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Groups ============

  // GET /api/v1/reminder-groups — list groups
  http.get(GROUPS_BASE, () => {
    const groups = createMockReminderGroupList(5);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: groups,
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/reminder-groups — create group
  http.post(GROUPS_BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockReminderGroup({ name: body.name as string }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // PUT /api/v1/reminder-groups/:id — update group
  http.put(`${GROUPS_BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockReminderGroup({
        id: params.id as string,
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/reminder-groups/:id — delete group
  http.delete(`${GROUPS_BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),
];
