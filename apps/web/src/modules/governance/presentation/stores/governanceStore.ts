/**
 * Governance Store - Pinia state management
 */

import { defineStore } from 'pinia';

export interface GovernanceRule {
  id: string;
  title: string;
  status?: string;
}

export interface GovernanceState {
  rules: GovernanceRule[];
  currentRule: GovernanceRule | null;
  isLoading: boolean;
  error: string | null;
}

export const useGovernanceStore = defineStore('governance', {
  state: (): GovernanceState => ({
    rules: [],
    currentRule: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    getRuleById: (state) => (id: string) => state.rules.find((rule) => rule.id === id),
    getRulesByStatus: (state) => (status: string) =>
      state.rules.filter((rule) => rule.status === status),
  },

  actions: {
    setRules(rules: GovernanceRule[]) {
      this.rules = rules;
    },

    addRule(rule: GovernanceRule) {
      this.rules.push(rule);
    },

    updateRule(rule: GovernanceRule) {
      const index = this.rules.findIndex((item) => item.id === rule.id);
      if (index !== -1) {
        this.rules[index] = rule;
      }
    },

    deleteRule(ruleId: string) {
      this.rules = this.rules.filter((rule) => rule.id !== ruleId);
    },

    setCurrentRule(rule: GovernanceRule | null) {
      this.currentRule = rule;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    reset() {
      this.rules = [];
      this.currentRule = null;
      this.isLoading = false;
      this.error = null;
    },
  },
});
