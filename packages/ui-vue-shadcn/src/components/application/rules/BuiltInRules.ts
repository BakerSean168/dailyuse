import type { StatusRule } from '@dailyuse/contracts/goal';

export const sortRulesByPriority = (rules: StatusRule[]) => {
  return [...rules].sort((left, right) => right.priority - left.priority);
};
