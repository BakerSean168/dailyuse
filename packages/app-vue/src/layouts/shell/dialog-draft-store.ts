import { inject, type InjectionKey, type Ref } from 'vue';

/** Scope supplied by AppShell so identical dialogs in separate business tabs never collide. */
export const DialogDraftScopeKey: InjectionKey<Readonly<Ref<string | null>>> =
  Symbol('DialogDraftScope');

const drafts = new Map<string, unknown>();

/** Clear transient drafts on identity/session teardown (also keeps isolated tests deterministic). */
export function clearDialogDrafts(): void {
  drafts.clear();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Draft state is outside routed content, so a recoverable panel remount cannot erase it. */
export function useDialogDraftStore() {
  const scope = inject(DialogDraftScopeKey, null);

  return {
    scope,
    load<T>(key: string): T | null {
      const value = drafts.get(key);
      return value === undefined ? null : clone(value as T);
    },
    save<T>(key: string, value: T): void {
      drafts.set(key, clone(value));
    },
    clear(key: string): void {
      drafts.delete(key);
    },
  };
}
