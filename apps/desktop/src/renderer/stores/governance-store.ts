import { create } from 'zustand';
import type { RuleClientDTO } from '@dailyuse/governance/contracts';
import { RuleClientService } from '@dailyuse/governance/application-client';
import { createRuleIpcAdapter, type IIpcClient } from '@dailyuse/governance/infrastructure-client';

interface GovernanceState {
  rules: RuleClientDTO[];
  currentRule: RuleClientDTO | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  fetchRules: () => Promise<void>;
  fetchRuleById: (id: string) => Promise<void>;
  searchRules: (query: string) => Promise<void>;
  clearError: () => void;
}

const ipcClient: IIpcClient = {
  invoke: (channel, ...args) => window.electronAPI.invoke(channel, ...args),
};

const apiClient = createRuleIpcAdapter(ipcClient);
const ruleClientService = new RuleClientService(apiClient);

export const useGovernanceStore = create<GovernanceState>((set) => ({
  rules: [],
  currentRule: null,
  loading: false,
  error: null,
  searchQuery: '',

  fetchRules: async () => {
    set({ loading: true, error: null });
    const result = await ruleClientService.fetchRules();
    if (!result.ok) {
      set({ loading: false, error: result.error.message, rules: [] });
      return;
    }
    set({ loading: false, rules: result.data });
  },

  fetchRuleById: async (id: string) => {
    set({ loading: true, error: null });
    const result = await ruleClientService.fetchRuleById(id);
    if (!result.ok) {
      set({ loading: false, error: result.error.message, currentRule: null });
      return;
    }
    set({ loading: false, currentRule: result.data });
  },

  searchRules: async (query: string) => {
    set({ loading: true, error: null, searchQuery: query });

    if (!query.trim()) {
      const result = await ruleClientService.fetchRules();
      if (!result.ok) {
        set({ loading: false, error: result.error.message, rules: [] });
        return;
      }
      set({ loading: false, rules: result.data });
      return;
    }

    const result = await ruleClientService.searchRules({ query });
    if (!result.ok) {
      set({ loading: false, error: result.error.message, rules: [] });
      return;
    }

    set({ loading: false, rules: result.data });
  },

  clearError: () => set({ error: null }),
}));
