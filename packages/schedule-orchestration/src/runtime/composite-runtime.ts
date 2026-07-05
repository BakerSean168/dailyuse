import type { RuntimeContribution } from '../ports/runtime-contribution';

export function createCompositeRuntimeContribution(
  contributions: readonly RuntimeContribution[],
): RuntimeContribution {
  let started = false;

  return {
    start() {
      if (started) {
        return;
      }

      for (const contribution of contributions) {
        contribution.start();
      }

      started = true;
    },

    stop() {
      if (!started) {
        return;
      }

      for (const contribution of [...contributions].reverse()) {
        contribution.stop();
      }

      started = false;
    },
  };
}
