type TypedEventMap = Record<string, unknown>;

export interface Publisher<TEvents extends TypedEventMap> {
  send<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
}

export interface Subscriber<TEvents extends TypedEventMap> {
  on<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): void;
  off<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): void;
}

export type TypedEventPort<TEvents extends TypedEventMap> = Publisher<TEvents> &
  Subscriber<TEvents>;

type PublisherSource<TEvents extends TypedEventMap> = {
  send<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
};

type SubscriberSource<TEvents extends TypedEventMap> = {
  on<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): unknown;
  off<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): unknown;
};

export function createTypedEventPublisher<TEvents extends TypedEventMap>(
  source: PublisherSource<TEvents>,
): Publisher<TEvents> {
  return {
    send(event, payload) {
      source.send(event, payload);
    },
  };
}

export function createTypedEventSubscriber<TEvents extends TypedEventMap>(
  source: SubscriberSource<TEvents>,
): Subscriber<TEvents> {
  return {
    on(event, handler) {
      source.on(event, handler);
    },
    off(event, handler) {
      source.off(event, handler);
    },
  };
}

export function createTypedEventPort<TEvents extends TypedEventMap>(
  source: PublisherSource<TEvents> & SubscriberSource<TEvents>,
): TypedEventPort<TEvents> {
  return {
    ...createTypedEventPublisher(source),
    ...createTypedEventSubscriber(source),
  };
}
