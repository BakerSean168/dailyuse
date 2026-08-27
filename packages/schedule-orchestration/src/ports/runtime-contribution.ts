/**
 * RuntimeContribution — 模块拥有的运行时副作用单元（R1-3）。
 *
 * 统一为 async start / async stop：
 * - start：按 composition root 声明顺序启动；projection listeners 必须排在 full repair 前。
 * - stop：按启动逆序关闭，并等待进行中的 dispatch/handler 排空。
 */
export interface RuntimeContribution {
  start(): Promise<void>;
  stop(): Promise<void>;
}
