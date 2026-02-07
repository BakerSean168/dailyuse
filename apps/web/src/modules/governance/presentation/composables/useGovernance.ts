import { computed } from 'vue';
import { useGovernanceStore } from '../stores/governanceStore';

export function useGovernance() {
  const store = useGovernanceStore();

  const rules = computed(() => store.rules);
  const currentRule = computed(() => store.currentRule);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);

  return {
    rules,
    currentRule,
    isLoading,
    error,
    setRules: store.setRules,
    addRule: store.addRule,
    updateRule: store.updateRule,
    deleteRule: store.deleteRule,
    setCurrentRule: store.setCurrentRule,
    setLoading: store.setLoading,
    setError: store.setError,
    reset: store.reset,
  };
}
