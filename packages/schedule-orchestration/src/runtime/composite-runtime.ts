import type { RuntimeContribution } from '../ports/runtime-contribution';

export function createCompositeRuntimeContribution(
  contributions: readonly RuntimeContribution[],
): RuntimeContribution {
  let started = false;

  return {
    async start(): Promise<void> {
      if (started) {
        return;
      }

      // R1-3：按声明顺序启动（每个 contribution 先 reconcile 再注册监听）。
      for (const contribution of contributions) {
        await contribution.start();
      }

      started = true;
    },

    async stop(): Promise<void> {
      if (!started) {
        return;
      }

      // R1-3：按启动逆序关闭，并等待每个 contribution 排空。
      for (const contribution of [...contributions].reverse()) {
        await contribution.stop();
      }

      started = false;
    },
  };
}
