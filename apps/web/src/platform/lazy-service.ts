type AsyncFactory<T> = () => Promise<T> | T;

export function createLazyService<T extends object>(factory: AsyncFactory<T>): T {
  let instance: T | null = null;
  let pending: Promise<T> | null = null;

  const resolveInstance = (): Promise<T> => {
    if (instance !== null) {
      return Promise.resolve(instance);
    }

    if (pending === null) {
      pending = Promise.resolve(factory())
        .then((resolved) => {
          instance = resolved;
          return resolved;
        })
        .catch((error) => {
          pending = null;
          throw error;
        });
    }

    return pending;
  };

  return new Proxy({} as T, {
    get(_target, property) {
      if (property === 'then' || typeof property === 'symbol') {
        return undefined;
      }

      return (...args: unknown[]) =>
        resolveInstance().then((resolved) => {
          const value = Reflect.get(resolved as object, property, resolved);

          if (typeof value !== 'function') {
            return value;
          }

          return (value as (...methodArgs: unknown[]) => unknown).apply(resolved, args);
        });
    },
  });
}
