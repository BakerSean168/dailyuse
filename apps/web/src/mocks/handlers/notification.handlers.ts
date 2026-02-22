/**
 * MSW Handlers - Notification Module
 *
 * Intercepts HTTP requests to the Notification API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import { createMockNotification, createMockNotificationList } from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/notifications`;

export const notificationHandlers = [
  // GET /api/v1/notifications — list notifications
  http.get(BASE, () => {
    const notifications = createMockNotificationList(15);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        notifications,
        total: notifications.length,
      },
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/notifications/:id/read — mark as read
  http.post(`${BASE}/:id/read`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Marked as read',
      data: createMockNotification({
        id: params.id as string,
        isRead: true,
        readAt: Date.now(),
      }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/notifications/read-all — mark all as read
  http.post(`${BASE}/read-all`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'All marked as read',
      data: { count: 5 },
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/notifications/:id — delete notification
  http.delete(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/notifications/dismiss-all — clear all
  http.delete(`${BASE}/dismiss-all`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'All cleared',
      data: { count: 15 },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/notifications/unread-count — get unread count
  http.get(`${BASE}/unread-count`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { count: fakerUnreadCount() },
      timestamp: Date.now(),
    });
  }),
];

function fakerUnreadCount(): number {
  return Math.floor(Math.random() * 20);
}
