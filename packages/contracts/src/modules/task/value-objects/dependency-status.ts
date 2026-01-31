/**
 * 依赖状态
 * 表示任务的依赖满足情况
 */
export const DependencyStatus = {
  /** 无依赖：任务没有前置依赖，可以立即开始 */
  None: 'None',
  /** 等待中：任务有前置依赖，但前置任务尚未完成 */
  Waiting: 'Waiting',
  /** 就绪：所有前置依赖已满足，任务可以开始 */
  Ready: 'Ready',
  /** 被阻塞：前置任务被阻塞或有问题，导致此任务也被阻塞 */
  Blocked: 'Blocked',
} as const;

export type DependencyStatus = (typeof DependencyStatus)[keyof typeof DependencyStatus];
