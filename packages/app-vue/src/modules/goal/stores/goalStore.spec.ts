import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGoalStore } from './goal-store';
describe('Goal store vNext',()=>{beforeEach(()=>setActivePinia(createPinia()));it('stores system-view/search state without folder/focus authority',()=>{const store=useGoalStore();expect(store.systemView).toBe('active');store.setSystemView('completed');store.setSearchQuery('run');expect(store.systemView).toBe('completed');expect(store.searchQuery).toBe('run');expect('goalFolders' in store.$state).toBe(false);expect('focusMode' in store.$state).toBe(false);});});
