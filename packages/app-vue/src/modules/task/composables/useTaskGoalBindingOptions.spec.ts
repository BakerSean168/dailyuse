import { createApp, defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import { DESKTOP_AUTH_API_KEY, GOAL_SERVICE_KEY } from '../../../di/keys';
import { useTaskGoalBindingOptions } from './useTaskGoalBindingOptions';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { unavailable: 'Unavailable' },
      goal: {
        error: {
          loadFailed: 'Could not load goal',
          loadKRFailed: 'Could not load key results',
        },
      },
    },
  },
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function mountComposable(goalService: { getGoalAggregateView: ReturnType<typeof vi.fn> }) {
  let result!: ReturnType<typeof useTaskGoalBindingOptions>;
  const app = createApp(
    defineComponent({
      setup() {
        result = useTaskGoalBindingOptions();
        return () => h('div');
      },
    }),
  );
  app.use(i18n);
  app.provide(GOAL_SERVICE_KEY, goalService as never);
  app.provide(DESKTOP_AUTH_API_KEY, undefined as never);
  const host = document.createElement('div');
  document.body.append(host);
  app.mount(host);
  return { result, unmount: () => app.unmount() };
}

describe('useTaskGoalBindingOptions', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('deduplicates concurrent requests for the same goal', async () => {
    const pending =
      deferred<ReturnType<typeof ok<{ goal: { id: string }; keyResults: never[] }>>>();
    const getGoalAggregateView = vi.fn(() => pending.promise);
    const { result, unmount } = mountComposable({ getGoalAggregateView });

    const first = result.loadKeyResults('goal-a');
    const second = result.loadKeyResults('goal-a');
    pending.resolve(ok({ goal: { id: 'goal-a' }, keyResults: [] }));

    await expect(Promise.all([first, second])).resolves.toEqual([[], []]);
    expect(getGoalAggregateView).toHaveBeenCalledTimes(1);
    expect(result.keyResultsByGoal.value).toEqual({ 'goal-a': [] });
    unmount();
  });

  it('loads the exact bound goal and resolves persisted IDs to display labels', async () => {
    const getGoalAggregateView = vi.fn().mockResolvedValue(
      ok({
        goal: { id: 'goal-a', name: 'Launch MemoFlow', description: null },
        keyResults: [
          {
            id: 'kr-a',
            title: 'Complete the product journey',
            weight: 1,
            progress: { initialValue: 0, currentValue: 0, targetValue: 10 },
          },
        ],
      }),
    );
    const { result, unmount } = mountComposable({ getGoalAggregateView });

    await result.loadGoalBinding('goal-a');

    expect(getGoalAggregateView).toHaveBeenCalledWith('goal-a');
    expect(getGoalAggregateView).toHaveBeenCalledTimes(1);
    expect(result.resolveGoalBinding({ goalId: 'goal-a', keyResultId: 'kr-a' })).toMatchObject({
      goalName: 'Launch MemoFlow',
      keyResultName: 'Complete the product journey',
    });
    unmount();
  });

  it('marks a missing goal or key result as unavailable instead of retaining a title snapshot', () => {
    const { result, unmount } = mountComposable({ getGoalAggregateView: vi.fn() });

    expect(
      result.resolveGoalBinding({ goalId: 'missing-goal', keyResultId: 'missing-kr' }),
    ).toMatchObject({
      goalName: 'Unavailable',
      keyResultName: 'Unavailable',
    });
    unmount();
  });
});
