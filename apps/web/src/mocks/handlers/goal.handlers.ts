/**
 * MSW Handlers - Goal Module
 *
 * Paths match the actual HTTP adapters:
 *   - GoalHttpAdapter:       /goals
 *   - GoalFolderHttpAdapter: /goal-folders
 *   - GoalFocusHttpAdapter:  /goals/focus
 */

import { http, HttpResponse } from 'msw';
import {
  createMockGoal,
  createMockQueryGoalsRes,
  createMockGoalFolder,
  createMockKeyResult,
  createMockGoalRecord,
  createMockGoalRecordList,
  createMockGoalReview,
  createMockGoalReviewList,
} from '@dailyuse/contracts/mocks';
import type { GoalClientDTO, GoalFolderClientDTO } from '@dailyuse/contracts/goal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const GOALS = `${API_BASE}/goals`;
const FOLDERS = `${API_BASE}/goal-folders`;

const toGoalId = (p: string | readonly string[] | undefined) =>
  (Array.isArray(p) ? p[0] : (p ?? '')) as GoalClientDTO['id'];

const toFolderId = (p: string | readonly string[] | undefined) =>
  (Array.isArray(p) ? p[0] : (p ?? '')) as GoalFolderClientDTO['id'];

export const goalHandlers = [
  // ============ Goals ============

  http.get(`${GOALS}/search`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockQueryGoalsRes(5),
      timestamp: Date.now(),
    });
  }),

  http.get(GOALS, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockQueryGoalsRes(10),
      timestamp: Date.now(),
    });
  }),

  http.post(GOALS, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockGoal({ name: body['title'] as string | undefined }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.post(`${GOALS}/:id/activate`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Activated',
      data: createMockGoal({ id: toGoalId(params['id']), status: 'Active' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${GOALS}/:id/pause`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Paused',
      data: createMockGoal({ id: toGoalId(params['id']), status: 'Archived' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${GOALS}/:id/complete`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Completed',
      data: createMockGoal({
        id: toGoalId(params['id']),
        status: 'Completed',
        completedAt: Date.now(),
      }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${GOALS}/:id/archive`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Archived',
      data: createMockGoal({ id: toGoalId(params['id']), status: 'Archived' }),
      timestamp: Date.now(),
    });
  }),

  // Key Results
  http.get(`${GOALS}/:goalId/key-results`, () => {
    const keyResults = Array.from({ length: 3 }, () => createMockKeyResult());
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { data: keyResults, total: keyResults.length },
      timestamp: Date.now(),
    });
  }),

  http.post(`${GOALS}/:goalId/key-results`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockKeyResult(body),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.put(`${GOALS}/:goalId/key-results/batch-weight`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: {},
      timestamp: Date.now(),
    });
  }),

  http.put(`${GOALS}/:goalId/key-results/:keyResultId`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockKeyResult(body),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${GOALS}/:goalId/key-results/:keyResultId`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: {},
      timestamp: Date.now(),
    });
  }),

  // Reviews
  http.get(`${GOALS}/:goalId/reviews`, ({ params }) => {
    const goalId = toGoalId(params['goalId']);
    const reviews = createMockGoalReviewList(3, { goalId });
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { data: reviews, total: reviews.length },
      timestamp: Date.now(),
    });
  }),

  http.post(`${GOALS}/:goalId/reviews`, async ({ params, request }) => {
    const goalId = toGoalId(params['goalId']);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockGoalReview({ goalId, ...(body as object) }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.put(`${GOALS}/:goalId/reviews/:reviewId`, async ({ params, request }) => {
    const goalId = toGoalId(params['goalId']);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockGoalReview({ goalId, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${GOALS}/:goalId/reviews/:reviewId`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: {},
      timestamp: Date.now(),
    });
  }),

  // Records
  http.get(`${GOALS}/:goalId/records`, ({ params }) => {
    const goalId = toGoalId(params['goalId']);
    const records = createMockGoalRecordList(5, { goalId });
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { data: records, total: records.length },
      timestamp: Date.now(),
    });
  }),

  http.get(`${GOALS}/:goalId/key-results/:keyResultId/records`, ({ params }) => {
    const goalId = toGoalId(params['goalId']);
    const keyResultId = (
      Array.isArray(params['keyResultId'])
        ? params['keyResultId'][0]
        : (params['keyResultId'] ?? '')
    ) as string;
    const records = createMockGoalRecordList(3, { goalId, keyResultId: keyResultId as any });
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { data: records, total: records.length },
      timestamp: Date.now(),
    });
  }),

  http.post(`${GOALS}/:goalId/key-results/:keyResultId/records`, async ({ params, request }) => {
    const goalId = toGoalId(params['goalId']);
    const keyResultId = (
      Array.isArray(params['keyResultId'])
        ? params['keyResultId'][0]
        : (params['keyResultId'] ?? '')
    ) as string;
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockGoalRecord({
          goalId,
          keyResultId: keyResultId as any,
          ...(body as object),
        }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.delete(`${GOALS}/:goalId/key-results/:keyResultId/records/:recordId`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: {},
      timestamp: Date.now(),
    });
  }),

  http.get(`${GOALS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockGoal({ id: toGoalId(params['id']) }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${GOALS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockGoal({ id: toGoalId(params['id']), ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${GOALS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: createMockGoal({ id: toGoalId(params['id']) }),
      timestamp: Date.now(),
    });
  }),

  // ============ Goal Folders ============

  http.get(FOLDERS, () => {
    const folders = Array.from({ length: 3 }, () => createMockGoalFolder());
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { data: folders, total: folders.length },
      timestamp: Date.now(),
    });
  }),

  http.post(FOLDERS, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockGoalFolder({ name: body['name'] as string | undefined }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.get(`${FOLDERS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockGoalFolder({ id: toFolderId(params['id']) }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${FOLDERS}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockGoalFolder({ id: toFolderId(params['id']), ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${FOLDERS}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Focus ============

  http.post(`${GOALS}/focus/start`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Started',
      data: { id: 'focus-1', status: 'active', startedAt: Date.now() },
      timestamp: Date.now(),
    });
  }),

  http.post(`${GOALS}/focus/stop`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Stopped',
      data: { id: 'focus-1', status: 'completed', stoppedAt: Date.now() },
      timestamp: Date.now(),
    });
  }),

  // AI
  http.get(`${API_BASE}/ai/generate/key-results`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: Array.from({ length: 3 }, () => createMockKeyResult()),
      timestamp: Date.now(),
    });
  }),
];
