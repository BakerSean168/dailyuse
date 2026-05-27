import { watch, type Ref } from 'vue';

const DRAFT_STORAGE_KEY = 'ai:chat-draft';

export function useAIDraftPersistence(chatMessage: Ref<string>, chatConversationId: Ref<string>) {
  function saveDraft(conversationId: string, message: string) {
    if (!conversationId) return;
    try {
      const stored = readDraftStorage();
      if (message.trim()) {
        stored[conversationId] = message;
      } else {
        delete stored[conversationId];
      }
      writeDraftStorage(stored);
    } catch {
      // Storage full or unavailable — silently ignore.
    }
  }

  function restoreDraft(conversationId: string): string {
    if (!conversationId) return '';
    const stored = readDraftStorage();
    return stored[conversationId] ?? '';
  }

  function clearDraft(conversationId: string) {
    if (!conversationId) return;
    const stored = readDraftStorage();
    delete stored[conversationId];
    writeDraftStorage(stored);
  }

  function bindDraftWatcher() {
    watch(
      () => chatMessage.value,
      (nextMessage) => {
        if (chatConversationId.value) {
          saveDraft(chatConversationId.value, nextMessage);
        }
      },
    );
  }

  return { saveDraft, restoreDraft, clearDraft, bindDraftWatcher };
}

// ─── Private helpers ──────────────────────────────────────────────

function readDraftStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeDraftStorage(next: Record<string, string>) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
}
