export class AsyncEventQueue<T> {
  private readonly values: T[] = [];
  private readonly waiters: Array<(value: IteratorResult<T>) => void> = [];
  private ended = false;
  private failure: unknown = null;

  push(value: T): void {
    if (this.ended) return;
    const waiter = this.waiters.shift();
    if (waiter) waiter({ value, done: false });
    else this.values.push(value);
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    for (const waiter of this.waiters.splice(0)) waiter({ value: undefined as T, done: true });
  }

  fail(error: unknown): void {
    this.failure = error;
    this.end();
  }

  async next(): Promise<IteratorResult<T>> {
    const value = this.values.shift();
    if (value !== undefined) return { value, done: false };
    if (this.ended) {
      if (this.failure) throw this.failure;
      return { value: undefined as T, done: true };
    }
    return new Promise<IteratorResult<T>>((resolve) => this.waiters.push(resolve));
  }
}
