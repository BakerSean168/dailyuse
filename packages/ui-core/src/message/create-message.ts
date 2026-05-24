/**
 * Message/Snackbar state management - Framework agnostic
 */

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface MessageOptions {
  text: string;
  type?: MessageType;
  duration?: number;
}

export interface MessageState {
  id: string;
  text: string;
  type: MessageType;
  duration: number;
}

export interface MessageStore {
  show: (options: MessageOptions) => string;
  success: (text: string, duration?: number) => string;
  error: (text: string, duration?: number) => string;
  warning: (text: string, duration?: number) => string;
  info: (text: string, duration?: number) => string;
  hide: (id: string) => void;
  clear: () => void;
}

export interface MessageStoreAdapter {
  getMessages: () => MessageState[];
  setMessages: (messages: MessageState[]) => void;
}

let messageIdCounter = 0;

function generateId(): string {
  return `msg_${++messageIdCounter}_${Date.now()}`;
}

/**
 * Create a message store with custom state adapter
 */
export function createMessageStore(adapter: MessageStoreAdapter): MessageStore {
  const scheduleRemoval = (id: string, duration: number) => {
    if (duration > 0) {
      setTimeout(() => {
        const messages = adapter.getMessages().filter((m) => m.id !== id);
        adapter.setMessages(messages);
      }, duration);
    }
  };

  const show = (options: MessageOptions): string => {
    const id = generateId();
    const message: MessageState = {
      id,
      text: options.text,
      type: options.type || 'info',
      duration: options.duration ?? 3000,
    };

    const messages = [...adapter.getMessages(), message];
    adapter.setMessages(messages);
    scheduleRemoval(id, message.duration);

    return id;
  };

  return {
    show,
    success: (text: string, duration?: number) => show({ text, type: 'success', duration }),
    error: (text: string, duration?: number) => show({ text, type: 'error', duration }),
    warning: (text: string, duration?: number) => show({ text, type: 'warning', duration }),
    info: (text: string, duration?: number) => show({ text, type: 'info', duration }),
    hide: (id: string) => {
      const messages = adapter.getMessages().filter((m) => m.id !== id);
      adapter.setMessages(messages);
    },
    clear: () => {
      adapter.setMessages([]);
    },
  };
}
