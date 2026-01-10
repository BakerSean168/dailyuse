// Event patterns - base event handler and dispatcher
// To be populated with BaseEventHandler and EventDispatcher

/**
 * Event handler type
 */
export type EventHandler<T = any> = (event: T) => void | Promise<void>;

/**
 * Event emitter interface
 */
export interface IEventEmitter {
  on(eventName: string, handler: EventHandler): void;
  once(eventName: string, handler: EventHandler): void;
  off(eventName: string, handler: EventHandler): void;
  emit(eventName: string, data?: any): Promise<void>;
  removeAllListeners(eventName?: string): void;
}