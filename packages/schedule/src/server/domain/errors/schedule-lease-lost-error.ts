/**
 * 调度宿主租约丢失错误
 *
 * 跨层类型错误：由基础设施的租约协调器抛出，但应用服务用 `instanceof` 做控制流判断。
 * 定义在领域层，基础设施与应用层均可依赖（应用 → 领域允许，基础设施 → 领域允许）。
 */
export class ScheduleLeaseLostError extends Error {
  constructor(message?: string) {
    super(message ?? 'Schedule host lease ownership was lost');
    this.name = 'ScheduleLeaseLostError';
  }
}
