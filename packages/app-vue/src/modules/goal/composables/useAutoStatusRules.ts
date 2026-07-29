import { ref } from 'vue';
import type { StatusRule } from '@memoflow/contracts/goal';

const configState = ref({
  enabled: false,
  allowManualOverride: true,
  notifyOnChange: false,
});

const rulesState = ref<StatusRule[]>([]);

const createRuleEngine = () => {
  const addRule = (rule: Omit<StatusRule, 'id'> | StatusRule) => {
    const nextRule: StatusRule = {
      ...(rule as StatusRule),
      id: (rule as StatusRule).id ?? String(Date.now()),
    };
    rulesState.value = [...rulesState.value, nextRule];
  };

  const updateRule = (ruleId: string, patch: Partial<StatusRule>) => {
    rulesState.value = rulesState.value.map((rule) =>
      rule.id === ruleId ? { ...rule, ...patch } : rule,
    );
  };

  const removeRule = (ruleId: string) => {
    rulesState.value = rulesState.value.filter((rule) => rule.id !== ruleId);
  };

  const getRules = () => rulesState.value;

  return {
    addRule,
    updateRule,
    removeRule,
    getRules,
  };
};

const engine = createRuleEngine();

export const useAutoStatusRules = () => {
  return {
    config: configState,
    getRuleEngine: () => engine,
  };
};
