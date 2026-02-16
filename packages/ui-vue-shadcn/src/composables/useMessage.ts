import { ref, computed, type Ref, type ComputedRef } from 'vue';
import {
  createMessageStore,
  type MessageType,
  type MessageOptions,
  type MessageState,
} from '@dailyuse/ui-core';

export interface UseMessageReturn {
  /** Current messages */
  messages: ComputedRef<MessageState[]>;
  /** Show a message */
  show: (options: MessageOptions) => string;
  /** Show success message */
  success: (text: string, duration?: number) => string;
  /** Show error message */
  error: (text: string, duration?: number) => string;
  /** Show warning message */
  warning: (text: string, duration?: number) => string;
  /** Show info message */
  info: (text: string, duration?: number) => string;
  /** Hide a message by ID */
  hide: (id: string) => void;
  /** Clear all messages */
  clear: () => void;
}

/**
 * Vue composable for message/snackbar management
 * Wraps @dailyuse/ui-core message logic with Vue reactivity
 */
export function useMessage(): UseMessageReturn {
  const messagesRef = ref<MessageState[]>([]);

  const store = createMessageStore({
    getMessages: () => messagesRef.value,
    setMessages: (messages) => {
      messagesRef.value = messages;
    },
  });

  return {
    messages: computed(() => messagesRef.value),
    show: store.show,
    success: store.success,
    error: store.error,
    warning: store.warning,
    info: store.info,
    hide: store.hide,
    clear: store.clear,
  };
}
