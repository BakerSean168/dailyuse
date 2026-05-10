import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { GoalBindingOption, KeyResultBindingOption } from '../components/types';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/executeDesktopAuthenticatedResult';

type GoalRecord = Record<string, unknown>;
type GoalLike = { toDTO?: () => GoalRecord } | GoalRecord;
type KeyResultLike = { toDTO?: () => GoalRecord } | GoalRecord;

function toPlainObject<T extends GoalRecord>(value: T | { toDTO?: () => T }): T {
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
  const { t } = useI18n();

  const goals = ref<GoalBindingOption[]>([]);
  const keyResultsByGoal = ref<Record<string, KeyResultBindingOption[]>>({});
  const loadingGoals = ref(false);
  const loadingKeyResults = ref<Record<string, boolean>>({});
  const loadError = ref<string | null>(null);

  async function executeGoalBindingOperation<T>(
    operation: () => Promise<{ ok: boolean; data?: T; error?: { code?: string; message?: string } }>,
    fallbackKey: string,
  ) {
    return executeDesktopAuthenticatedResult({
      operation,
      logScope: 'TaskGoalBindingOptions',
      t,
      fallbackKey,
      onError: (error, translatedMessage) => {
        loadError.value = translatedMessage;
        console.error('[TaskGoalBindingOptions] operation failed', error);
      },
    });
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
        const listParams = {
          page,
          pageSize: GOAL_BINDING_PAGE_SIZE,
          systemView: 'active' as const,
        };
        const result = await executeGoalBindingOperation(
          () => goalService.listGoals(listParams),
          'goal.error.loadListFailed',
        );

        if (!result.ok) {
          goals.value = [];
          return [];
        }

        collectedGoals.push(...(result.data.goals ?? []).map((goal: GoalLike) => mapGoalOption(goal)));

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
      const result = await executeGoalBindingOperation(
        () => goalService.getKeyResults(goalId),
        'goal.error.loadKRFailed',
      );

      if (!result.ok) {
        keyResultsByGoal.value = {
          ...keyResultsByGoal.value,
          [goalId]: [],
        };
        return [];
      }

      const mapped = (result.data.keyResults ?? []).map((keyResult: KeyResultLike) =>
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
