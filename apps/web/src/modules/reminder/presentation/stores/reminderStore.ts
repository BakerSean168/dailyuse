/**
 * Reminder Store - Pinia 状态管理
 * 管理 Reminder 模块的所有状态
 */

import { defineStore } from 'pinia';
import type { ReminderDTO, ReminderGroupDTO } from '@dailyuse/contracts/reminder';

export interface ReminderState {
  reminders: ReminderDTO[];
  reminderGroups: ReminderGroupDTO[];
  currentReminder: ReminderDTO | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

export const useReminderStore = defineStore('reminder', {
  state: (): ReminderState => ({
    reminders: [],
    reminderGroups: [],
    currentReminder: null,
    isLoading: false,
    error: null,
    searchQuery: '',
  }),

  getters: {
    getReminderById: (state) => (id: string) => state.reminders.find((r) => r.id === id),
    getTotalReminders: (state) => state.reminders.length,
    getPendingReminders: (state) => state.reminders.filter((r) => !r.isCompleted),
  },

  actions: {
    setReminders(reminders: ReminderDTO[]) {
      this.reminders = reminders;
    },

    addReminder(reminder: ReminderDTO) {
      this.reminders.push(reminder);
    },

    updateReminder(reminder: ReminderDTO) {
      const idx = this.reminders.findIndex((r) => r.id === reminder.id);
      if (idx !== -1) this.reminders[idx] = reminder;
    },

    deleteReminder(id: string) {
      this.reminders = this.reminders.filter((r) => r.id !== id);
    },

    setReminderGroups(groups: ReminderGroupDTO[]) {
      this.reminderGroups = groups;
    },

    setCurrentReminder(reminder: ReminderDTO | null) {
      this.currentReminder = reminder;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    reset() {
      this.reminders = [];
      this.reminderGroups = [];
      this.currentReminder = null;
      this.isLoading = false;
      this.error = null;
      this.searchQuery = '';
    },
  },

  persist: {
    paths: ['searchQuery'],
  },
});
