import { ref } from 'vue';
import { AuthChannels } from '@dailyuse/contracts/electron';
import type { ResultError } from '@dailyuse/contracts/result';
import type { Goal, KeyResult } from '@dailyuse/goal/domain-client';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { GoalBindingOption, KeyResultBindingOption } from '../components/types';

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

export function useTaskGoalBindingOptions() {
  const goalService = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');

  const goals = ref<GoalBindingOption[]>([]);
  const keyResultsByGoal = ref<Record<string, KeyResultBindingOption[]>>({});
  const loadingGoals = ref(false);
  const loadingKeyResults = ref<Record<string, boolean>>({});
  const loadError = ref<string | null>(null);

  async function ensureDesktopAuthReady(): Promise<boolean> {
    const api = (window as any)?.electronAPI;
    if (!api?.invoke) {
      return false;
    }

    try {
      const status = (await api.invoke(AuthChannels.GET_STATUS)) as {
        authenticated?: boolean;
        runtimeState?: string;
      };

      if (status?.authenticated) {
        return true;
      }

      if (status?.runtimeState === 'RESTORING' || status?.runtimeState === 'UNINITIALIZED') {
        await api.invoke(AuthChannels.INITIALIZE);
        const refreshed = (await api.invoke(AuthChannels.GET_STATUS)) as {
          authenticated?: boolean;
        };
        return Boolean(refreshed?.authenticated);
      }
    } catch (error) {
      console.warn('[TaskGoalBindingOptions] Failed to ensure desktop auth readiness', error);
    }

    return false;
  }

  async function maybeRecoverAuth(error: ResultError): Promise<boolean> {
    if (error.code !== 'AUTH_REQUIRED' && error.code !== 'AUTH_RESTORING') {
      return false;
    }

    return ensureDesktopAuthReady();
  }

  async function loadGoals(force = false): Promise<GoalBindingOption[]> {
    if (!force && goals.value.length > 0) {
      return goals.value;
    }

    loadingGoals.value = true;
    loadError.value = null;

    try {
      let result = await goalService.listGoals({
        page: 1,
        pageSize: 200,
        systemView: 'active',
      });

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await goalService.listGoals({
          page: 1,
          pageSize: 200,
          systemView: 'active',
        });
      }

      if (!result.ok) {
        loadError.value = result.error.message;
        goals.value = [];
        console.error('[TaskGoalBindingOptions] Failed to load goals', result.error);
        return [];
      }

      goals.value = (result.data.goals ?? []).map((goal: Goal) => mapGoalOption(goal));
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
