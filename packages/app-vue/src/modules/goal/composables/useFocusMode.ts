import { computed } from 'vue';
import { useGoalStore } from '../stores/goal-store';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
export function useFocusMode() {
  const store = useGoalStore();
  const service = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');

  const currentFocusMode = computed(() => store.currentFocusMode);

  async function getCurrentFocusMode() {
    const result = await service.getCurrentFocusMode();
    if (result.ok) {
      store.setCurrentFocusMode(result.data ?? null);
    }
    return result;
  }

  async function activateFocusMode(request: {
    focusedGoalIds: string[];
    hiddenGoalsMode?: string;
  }) {
    const sanitizedRequest = sanitizeForIpc(request);
    const result = await service.activateFocusMode(sanitizedRequest as never);
    if (result.ok) {
      store.setCurrentFocusMode(result.data ?? null);
    }
    return result;
  }

  async function deactivateFocusMode() {
    const result = await service.deactivateFocusMode();
    if (result.ok) {
      store.setCurrentFocusMode(result.data ?? null);
    }
    return result;
  }

  async function extendFocusMode(newEndTime: number) {
    const result = await service.extendFocusMode(newEndTime);
    if (result.ok) {
      store.setCurrentFocusMode(result.data ?? null);
    }
    return result;
  }

  return {
    currentFocusMode,
    getCurrentFocusMode,
    activateFocusMode,
    deactivateFocusMode,
    extendFocusMode,
  };
}
