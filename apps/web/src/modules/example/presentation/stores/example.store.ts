import { defineStore } from 'pinia';
import type { ItemClientDTO } from '@dailyuse/contracts/example';

export const useExampleStore = defineStore('example', {
  state: () => ({
    items: [] as ItemClientDTO[],
    loading: false,
  }),
  actions: {
    addItem(item: ItemClientDTO) {
      this.items.push(item);
    },
    async fetchItems() {
      this.loading = true;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      this.loading = false;
    }
  }
});
