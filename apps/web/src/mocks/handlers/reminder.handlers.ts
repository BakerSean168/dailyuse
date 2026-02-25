/**
 * MSW Handlers - Reminder Module
 *
 * Paths match the actual HTTP adapter:
 *   - ReminderHttpAdapter: /reminders/templates, /reminder-groups, /reminders/upcoming
 */

import { http, HttpResponse } from 'msw';
import {
  createMockReminderTemplate,
  createMockReminderTemplateList,
  createMockReminderGroup,
  createMockReminderGroupList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TEMPLATES = `${API_BASE}/reminders/templates`;
const GROUPS = `${API_BASE}/reminder-groups`;

export const reminderHandlers = [
  // ============ Templates ============

  http.get(`${TEMPLATES}/search`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockReminderTemplateList(5),
      timestamp: Date.now(),
    });
  }),

  http.get(`${TEMPLATES}/user/:identityId`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockReminderTemplateList(8),
      timestamp: Date.now(),
    });
  }),

  http.get(TEMPLATES, () => {
    const templates = createMockReminderTemplateList(10);
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: templates,
      total: templates.length,
      timestamp: Date.now(),
    });
  }),

  http.post(TEMPLATES, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ok: true, code: 200, message: 'Created', data: createMockReminderTemplate({ name: body.name as string }), timestamp: Date.now() },
      { status: 201 },
    );
  }),

  http.get(`${TEMPLATES}/:id/schedule-status`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { isScheduled: true, nextFireAt: Date.now() + 3600000, lastFiredAt: Date.now() - 3600000 },
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/toggle`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Toggled',
      data: createMockReminderTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:templateId/move`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Moved',
      data: createMockReminderTemplate({ id: params.templateId as string }),
      timestamp: Date.now(),
    });
  }),

  http.get(`${TEMPLATES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockReminderTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${TEMPLATES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockReminderTemplate({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${TEMPLATES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockReminderTemplate({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TEMPLATES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Upcoming ============

  http.get(`${API_BASE}/reminders/upcoming`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { reminders: [], total: 0 },
      timestamp: Date.now(),
    });
  }),

  // ============ Groups ============

  http.get(`${GROUPS}/user/:identityId`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockReminderGroupList(3),
      timestamp: Date.now(),
    });
  }),

  http.get(GROUPS, () => {
    const groups = createMockReminderGroupList(5);
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: groups,
      timestamp: Date.now(),
    });
  }),

  http.post(GROUPS, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ok: true, code: 200, message: 'Created', data: createMockReminderGroup({ name: body.name as string }), timestamp: Date.now() },
      { status: 201 },
    );
  }),

  http.post(`${GROUPS}/:id/toggle-status`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Toggled',
      data: createMockReminderGroup({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${GROUPS}/:id/toggle-control-mode`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Toggled',
      data: createMockReminderGroup({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.get(`${GROUPS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockReminderGroup({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${GROUPS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockReminderGroup({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${GROUPS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockReminderGroup({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${GROUPS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),
];
