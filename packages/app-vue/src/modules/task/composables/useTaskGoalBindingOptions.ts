import { ref } from 'vue';
import type { Goal, KeyResult } from '@dailyuse/goal/domain-client';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { GoalBindingOption, KeyResultBindingOption } from '../components/types';
import {
  getDesktopAuthApi,
  recoverDesktopAuthIfNeeded,
} from '../../../shared/utils/desktopAuthRecovery';

type GoalLike = Goal | { toDTO?: () => Record<string, any> } | Record<string, any>;
type KeyResultLike = KeyResult | { toDTO?: () => Record<string, any> } | Record<string, any>;

function toPlainObject<T extends Record<string, any>>(value: T | { toDTO?: () => T }): T {
  if (value && typeof (value as { toDTO?: () => T }).toDTO === 'function') {
    return (value as { toDTO: () => T }).toDTO();
  }

  return value as T;
}

function mapGoalOption(goal: GoalLike): GoalBindingOption {
  const dto = toPlainObject(goal);

  return {
    id: String(dto.id),
    title: String(dto.name ?? dto.title ?? ''),
    description: dto.description ?? undefined,
    status: dto.status ?? undefined,
  };
}

function mapKeyResultOption(keyResult: KeyResultLike): KeyResultBindingOption {
  const dto = toPlainObject(keyResult);
  const progress = dto.progress ?? {};
  const current = Number(progress.currentValue ?? progress.current ?? 0);
  const target = Number(progress.targetValue ?? progress.target ?? 0);

  return {
    id: String(dto.id),
    title: String(dto.title ?? ''),
    weight: Number(dto.weight ?? 0),
    progress: {
      current,
      target,
      percentage: Number(progress.progressPercentage ?? progress.percentage ?? 0),
    },
  };
}

const GOAL_BINDING_PAGE_SIZE = 100;

export function useTaskGoalBindingOptions() {
  const goalService = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');

  const goals = ref<GoalBindingOption[]>([]);
  const keyResultsByGoal = ref<Record<string, KeyResultBindingOption[]>>({});
  const loadingGoals = ref(false);
  const loadingKeyResults = ref<Record<string, boolean>>({});
  const loadError = ref<string | null>(null);

  async function maybeRecoverAuth(error: { code?: string }): Promise<boolean> {
    return recoverDesktopAuthIfNeeded(error, getDesktopAuthApi(), 'TaskGoalBindingOptions');
  }

  async function loadGoals(force = false): Promise<GoalBindingOption[]> {
    if (!force && goals.value.length > 0) {
      return goals.value;
    }

    loadingGoals.value = true;
    loadError.value = null;

    try {
      const collectedGoals: GoalBindingOption[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        let result = await goalService.listGoals({
          page,
          // Goal list query validation caps pageSize at 100.
          pageSize: GOAL_BINDING_PAGE_SIZE,
          systemView: 'active',
        });

        if (!result.ok && (await maybeRecoverAuth(result.error))) {
          result = await goalService.listGoals({
            page,
            pageSize: GOAL_BINDING_PAGE_SIZE,
            systemView: 'active',
          });
        }

        if (!result.ok) {
          loadError.value = result.error.message;
          goals.value = [];
          console.error('[TaskGoalBindingOptions] Failed to load goals', result.error);
          return [];
        }

        collectedGoals.push(...(result.data.goals ?? []).map((goal: Goal) => mapGoalOption(goal)));

        const pagination = result.data.pagination;
        hasMore = Boolean(pagination?.hasMore);
        page += 1;
      }

      goals.value = collectedGoals;
      return goals.value;
    } finally {
      loadingGoals.value = false;
    }
  }

  async function loadKeyResults(goalId: string, force = false): Promise<KeyResultBindingOption[]> {
    if (!goalId) {
      return [];
    }

    if (!force && keyResultsByGoal.value[goalId]) {
      return keyResultsByGoal.value[goalId];
    }

    loadingKeyResults.value = {
      ...loadingKeyResults.value,
      [goalId]: true,
    };
    loadError.value = null;

    try {
      let result = await goalService.getKeyResults(goalId);

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await goalService.getKeyResults(goalId);
      }

      if (!result.ok) {
        loadError.value = result.error.message;
        keyResultsByGoal.value = {
          ...keyResultsByGoal.value,
          [goalId]: [],
        };
        console.error('[TaskGoalBindingOptions] Failed to load key results', {
          goalId,
          error: result.error,
        });
        return [];
      }

      const mapped = (result.data.keyResults ?? []).map((keyResult: KeyResult) =>
        mapKeyResultOption(keyResult),
      );

      keyResultsByGoal.value = {
        ...keyResultsByGoal.value,
        [goalId]: mapped,
      };

      return mapped;
    } finally {
      loadingKeyResults.value = {
        ...loadingKeyResults.value,
        [goalId]: false,
      };
    }
  }

  return {
    goals,
    keyResultsByGoal,
    loadingGoals,
    loadingKeyResults,
    loadError,
    loadGoals,
    loadKeyResults,
  };
}
