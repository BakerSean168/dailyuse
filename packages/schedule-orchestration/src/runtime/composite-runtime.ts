import type { RuntimeContribution } from '../ports/runtime-contribution';

export function createCompositeRuntimeContribution(
  contributions: readonly RuntimeContribution[],
): RuntimeContribution {
  let started = false;

  return {
    async start(): Promise<void> {
      if (started) return;

      // Order is an ownership contract. Projection listener contributions are
      // declared before the common durable repair sweep so startup mutations
      // cannot fall into a listener-registration gap.
      for (const contribution of contributions) {
        await contribution.start();
      }
      started = true;
    },

    async stop(): Promise<void> {
      if (!started) return;

      for (const contribution of [...contributions].reverse()) {
        await contribution.stop();
      }
      started = false;
    },
  };
}
