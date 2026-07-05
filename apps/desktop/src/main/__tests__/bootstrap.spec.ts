import { describe, expect, it, vi } from 'vitest';
import { ElectronBootstrapper } from '../bootstrap';

describe('ElectronBootstrapper', () => {
  it('registers modules in order with the shared db and auth context', async () => {
    const db = { name: 'powersync-db' };
    const auth = { getAuthContext: vi.fn() };
    const observed: string[] = [];

    const bootstrapper = new ElectronBootstrapper(db as never);
    bootstrapper
      .register({
        name: 'FirstModule',
        register: vi.fn(async (context) => {
          observed.push(`first:${String(context.db === db)}:${String(context.auth === auth)}`);
        }),
      })
      .register({
        name: 'SecondModule',
        register: vi.fn(async (context) => {
          observed.push(`second:${String(context.db === db)}:${String(context.auth === auth)}`);
        }),
      });

    await bootstrapper.init(auth as never);

    expect(bootstrapper.getModuleNames()).toEqual(['FirstModule', 'SecondModule']);
    expect(observed).toEqual(['first:true:true', 'second:true:true']);
  });

  it('destroys modules in reverse order', async () => {
    const destroyed: string[] = [];
    const bootstrapper = new ElectronBootstrapper({} as never);

    bootstrapper
      .register({
        name: 'FirstModule',
        register: vi.fn(),
        destroy: vi.fn(async () => {
          destroyed.push('first');
        }),
      })
      .register({
        name: 'SecondModule',
        register: vi.fn(),
        destroy: vi.fn(async () => {
          destroyed.push('second');
        }),
      });

    await bootstrapper.destroy();

    expect(destroyed).toEqual(['second', 'first']);
  });
});
