import { ref } from 'vue';

const goalsState = ref<any[]>([]);

export const useGoal = () => {
  const goals = goalsState;

  const createGoalRecord = async (
    _goalId: string,
    _keyResultId: string,
    _payload: {
      value: number;
      note?: string;
      recordedAt?: number;
    },
  ) => {
    return;
  };

  const getGoalAggregateView = async (_goalId: string) => {
    return null;
  };

  return {
    goals,
    createGoalRecord,
    getGoalAggregateView,
  };
};
