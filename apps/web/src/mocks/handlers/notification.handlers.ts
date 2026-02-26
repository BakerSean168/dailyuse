/**
 * MSW Handlers - Notification Module
 *
 * Paths match the actual HTTP adapter:
 *   - NotificationHttpAdapter: /api/v1/notifications
 */

import { http, HttpResponse } from 'msw';
import { createMockNotification, createMockNotificationList } from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/notifications`;

export const notificationHandlers = [
  // GET /notifications — list notifications
  http.get(BASE, () => {
    const notifications = createMockNotificationList(15);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { notifications, total: notifications.length, page: 1, pageSize: 20, hasMore: false },
      timestamp: Date.now(),
    });
  }),

  // POST /notifications — create notification
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockNotification(body),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // GET /notifications/unread-count
  http.get(`${BASE}/unread-count`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { count: Math.floor(Math.random() * 20) },
      timestamp: Date.now(),
    });
  }),

  // PATCH /notifications/read-all — mark all as read
  http.patch(`${BASE}/read-all`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'All marked as read',
      data: { ok: true, count: 5 },
      timestamp: Date.now(),
    });
  }),

  // POST /notifications/batch-delete
  http.post(`${BASE}/batch-delete`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Batch deleted',
      data: { ok: true, count: 0 },
      timestamp: Date.now(),
    });
  }),

  // PATCH /notifications/:id/read — mark as read
  http.patch(`${BASE}/:id/read`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Marked as read',
      data: createMockNotification({ id: params.id as string, isRead: true, readAt: Date.now() }),
      timestamp: Date.now(),
    });
  }),

  // GET /notifications/:id
  http.get(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockNotification({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /notifications/:id — delete notification
  http.delete(`${BASE}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { ok: true },
      timestamp: Date.now(),
    });
  }),
];
