/**
 * RuntimeContribution — 模块拥有的运行时副作用单元（R1-3）。
 *
 * 统一为 async start / async stop：
 * - start：先执行初次 reconcile（投影对账），再注册监听器；
 * - stop：按启动逆序关闭，并等待进行中的 dispatch/handler 排空。
 */
export interface RuntimeContribution {
  start(): Promise<void>;
  stop(): Promise<void>;
}
