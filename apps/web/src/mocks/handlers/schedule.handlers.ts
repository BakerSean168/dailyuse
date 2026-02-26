/**
 * MSW Handlers - Schedule Module
 *
 * Paths match the actual HTTP adapters:
 *   - ScheduleEventHttpAdapter: /schedules/events
 *   - ScheduleTaskHttpAdapter:  /schedules/tasks
 */

import { http, HttpResponse } from 'msw';
import {
  createMockScheduleTask,
  createMockScheduleTaskList,
  createMockScheduleExecution,
  createMockScheduleExecutionList,
} from '@dailyuse/contracts/mocks';
import { faker } from '@faker-js/faker';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const EVENTS = `${API_BASE}/schedules/events`;
const TASKS = `${API_BASE}/schedules/tasks`;

function createMockCalendarEntry(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  const start = now + faker.number.int({ min: 3600000, max: 86400000 });
  return {
    id: faker.string.uuid(),
    identityId: faker.string.uuid(),
    title: faker.lorem.words({ min: 2, max: 5 }),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    startTime: start,
    endTime: start + faker.number.int({ min: 1800000, max: 7200000 }),
    duration: faker.number.int({ min: 30, max: 120 }),
    priority: faker.number.int({ min: 1, max: 5 }),
    location: faker.datatype.boolean() ? faker.location.streetAddress() : null,
    attendees: [],
    status: faker.helpers.arrayElement(['Active', 'Completed', 'Cancelled']),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export const scheduleHandlers = [
  // ============ Events ============

  http.get(`${EVENTS}/conflicts/detect`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { hasConflict: false, conflicts: [], suggestions: [] },
      timestamp: Date.now(),
    });
  }),

  http.get(EVENTS, () => {
    const events = Array.from({ length: 8 }, () => createMockCalendarEntry());
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: events,
      timestamp: Date.now(),
    });
  }),

  http.post(`${EVENTS}/conflicts/detect`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { hasConflict: false, conflicts: [], suggestions: [] },
      timestamp: Date.now(),
    });
  }),

  http.post(`${EVENTS}/with-conflict-detection`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: { schedule: createMockCalendarEntry(body), conflicts: null },
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.post(EVENTS, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockCalendarEntry(body),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.get(`${EVENTS}/:id/conflicts`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { hasConflict: false, conflicts: [], suggestions: [] },
      timestamp: Date.now(),
    });
  }),

  http.post(`${EVENTS}/:id/resolve-conflict`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Resolved',
      data: {
        schedule: createMockCalendarEntry({ id: params.id }),
        conflicts: { hasConflict: false, conflicts: [], suggestions: [] },
        applied: { strategy: 'move', changes: [] },
      },
      timestamp: Date.now(),
    });
  }),

  http.get(`${EVENTS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockCalendarEntry({ id: params.id }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${EVENTS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockCalendarEntry({ id: params.id, ...body }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${EVENTS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Schedule Tasks ============

  http.get(`${TASKS}/due`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockScheduleTaskList(3),
      timestamp: Date.now(),
    });
  }),

  http.get(TASKS, () => {
    const tasks = createMockScheduleTaskList(10);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { tasks, total: tasks.length },
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/batch`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>[];
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: body.map(() => createMockScheduleTask()),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.post(`${TASKS}/batch/delete`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { count: 0 },
      timestamp: Date.now(),
    });
  }),

  http.post(TASKS, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockScheduleTask({ name: body.name as string }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.get(`${TASKS}/:taskId`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockScheduleTask({ id: params.taskId as string }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/:taskId/pause`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Paused',
      data: createMockScheduleTask({
        id: params.taskId as string,
        status: 'Paused',
        enabled: false,
      }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/:taskId/resume`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Resumed',
      data: createMockScheduleTask({
        id: params.taskId as string,
        status: 'Active',
        enabled: true,
      }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/:taskId/complete`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Completed',
      data: createMockScheduleTask({ id: params.taskId as string, status: 'Completed' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/:taskId/cancel`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Cancelled',
      data: createMockScheduleTask({ id: params.taskId as string, status: 'Cancelled' }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${TASKS}/:taskId/metadata`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockScheduleTask({ id: params.taskId as string }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TASKS}/:taskId`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.taskId },
      timestamp: Date.now(),
    });
  }),
];
