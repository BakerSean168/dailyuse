import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Result } from '@memoflow/contracts/result';
import { GOAL_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  GoalBindingOption,
  KeyResultBindingOption,
  TaskGoalBindingViewModel,
} from '../components/types';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';

type GoalOptionDTO = {
  id: string;
  name?: string;
  title?: string;
  description?: string | null;
  status?: string;
};

type KeyResultProgressDTO = {
  currentValue?: number;
  current?: number;
  targetValue?: number;
  target?: number;
  progressPercentage?: number;
  percentage?: number;
};

type KeyResultOptionDTO = {
  id: string;
  title?: string;
  weight?: number;
  progress?: KeyResultProgressDTO;
};

type GoalLike = { toDTO?: () => GoalOptionDTO } | GoalOptionDTO;
type KeyResultLike = { toDTO?: () => KeyResultOptionDTO } | KeyResultOptionDTO;

function toPlainObject<T extends object>(value: T | { toDTO?: () => T }): T {
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
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const { t } = useI18n();

  const goals = ref<GoalBindingOption[]>([]);
  const keyResultsByGoal = ref<Record<string, KeyResultBindingOption[]>>({});
  const loadingGoals = ref(false);
  const loadingKeyResults = ref<Record<string, boolean>>({});
  const keyResultErrorsByGoal = ref<Record<string, string | null>>({});
  const loadError = ref<string | null>(null);
  const inFlightGoals = new Map<string, Promise<GoalBindingOption | undefined>>();
  const inFlightKeyResults = new Map<string, Promise<KeyResultBindingOption[]>>();

  async function executeGoalBindingOperation<T>(
    operation: () => Promise<Result<T>>,
    fallbackKey: string,
  ): Promise<Result<T>> {
    return executeDesktopAuthenticatedResult({
      operation,
      logScope: 'TaskGoalBindingOptions',
      t,
      fallbackKey,
      desktopApi,
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

  function loadGoal(goalId: string, force = false): Promise<GoalBindingOption | undefined> {
    if (!goalId) {
      return Promise.resolve(undefined);
    }

    const cached = goals.value.find((goal) => goal.id === goalId);
    if (!force && cached) {
      return Promise.resolve(cached);
    }

    const pending = inFlightGoals.get(goalId);
    if (pending) {
      return pending;
    }

    const request = executeGoalBindingOperation(
      () => goalService.getGoal(goalId),
      'goal.error.loadFailed',
    )
      .then((result) => {
        if (!result.ok) {
          return undefined;
        }

        const mapped = mapGoalOption(result.data as GoalLike);
        goals.value = [...goals.value.filter((goal) => goal.id !== goalId), mapped];
        return mapped;
      })
      .finally(() => {
        if (inFlightGoals.get(goalId) === request) {
          inFlightGoals.delete(goalId);
        }
      });

    inFlightGoals.set(goalId, request);
    return request;
  }

  async function requestKeyResults(goalId: string): Promise<KeyResultBindingOption[]> {
    keyResultErrorsByGoal.value = {
      ...keyResultErrorsByGoal.value,
      [goalId]: null,
    };
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
        keyResultErrorsByGoal.value = {
          ...keyResultErrorsByGoal.value,
          [goalId]: loadError.value ?? t('goal.error.loadKRFailed'),
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
    } catch (error) {
      const message = t('goal.error.loadKRFailed');
      loadError.value = message;
      keyResultsByGoal.value = {
        ...keyResultsByGoal.value,
        [goalId]: [],
      };
      keyResultErrorsByGoal.value = {
        ...keyResultErrorsByGoal.value,
        [goalId]: message,
      };
      console.error('[TaskGoalBindingOptions] failed to load key results', error);
      return [];
    } finally {
      loadingKeyResults.value = {
        ...loadingKeyResults.value,
        [goalId]: false,
      };
    }
  }

  function loadKeyResults(goalId: string, force = false): Promise<KeyResultBindingOption[]> {
    if (!goalId) {
      return Promise.resolve([]);
    }

    if (!force && keyResultsByGoal.value[goalId]) {
      return Promise.resolve(keyResultsByGoal.value[goalId]);
    }

    const pending = inFlightKeyResults.get(goalId);
    if (pending) {
      return pending;
    }

    const request = requestKeyResults(goalId).finally(() => {
      if (inFlightKeyResults.get(goalId) === request) {
        inFlightKeyResults.delete(goalId);
      }
    });
    inFlightKeyResults.set(goalId, request);
    return request;
  }

  async function loadGoalBinding(goalId: string): Promise<void> {
    await Promise.all([loadGoal(goalId), loadKeyResults(goalId)]);
  }

  async function loadGoalBindings(goalIds: Array<string | null | undefined>): Promise<void> {
    const uniqueGoalIds = [...new Set(goalIds.filter((goalId): goalId is string => !!goalId))];
    await Promise.all(uniqueGoalIds.map((goalId) => loadGoalBinding(goalId)));
  }

  function clearErrors(): void {
    loadError.value = null;
    keyResultErrorsByGoal.value = {};
  }

  function resolveGoalBinding(
    binding: TaskGoalBindingViewModel | null | undefined,
  ): TaskGoalBindingViewModel | null | undefined {
    if (!binding?.goalId) {
      return binding;
    }

    const goal = goals.value.find((option) => option.id === binding.goalId);
    const keyResult = keyResultsByGoal.value[binding.goalId]?.find(
      (option) => option.id === binding.keyResultId,
    );

    return {
      ...binding,
      goalTitle: goal?.title ?? binding.goalTitle,
      keyResultTitle: keyResult?.title ?? binding.keyResultTitle,
    };
  }

  return {
    goals,
    keyResultsByGoal,
    loadingGoals,
    loadingKeyResults,
    keyResultErrorsByGoal,
    loadError,
    loadGoals,
    loadGoal,
    loadKeyResults,
    loadGoalBinding,
    loadGoalBindings,
    clearErrors,
    resolveGoalBinding,
  };
}
