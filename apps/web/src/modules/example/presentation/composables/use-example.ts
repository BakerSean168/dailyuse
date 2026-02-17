import { useExampleStore } from '../stores/example.store';
import { storeToRefs } from 'pinia';

export function useExample() {
  const store = useExampleStore();
  const { items, loading } = storeToRefs(store);
  const { addItem, fetchItems } = store;

  return {
    items,
    loading,
    addItem,
    fetchItems
  };
}
