import type { IGoalRepository } from '../repositories/i-goal-repository';
import type { Goal } from '../aggregates/goal';

export class GoalHierarchyDomainService {
  constructor(private goalRepo: IGoalRepository) {}

  /**
   * ✅ 校验移动合法性：防止循环引用 (Circular Dependency)
   * 规则：目标不能移动到它自己的子孙节点下
   */
  public async validateParentChange(goalId: string, newParentId: string | null): Promise<void> {
    if (!newParentId) return; // 移动到根节点，永远合法
    if (goalId === newParentId) throw new Error('Cannot set parent to self');

    // 1. 获取新父节点的所有祖先路径 (或者反过来，递归检查新父节点的祖先是否包含 goalId)
    // 这通常需要 Repository 提供专门的高效查询方法 (如 CTE 递归查询)
    const isCircular = await this.goalRepo.isAncestor(goalId, newParentId);

    if (isCircular) {
      throw new Error('Circular dependency detected: Cannot move a goal under its own child.');
    }
  }

  /**
   * ✅ 级联处理：当父目标被归档/删除时，子目标怎么办？
   * 业务规则可能是：全部归档，或者子目标升级为根目标
   */
  public async handleParentArchived(parentGoalId: string): Promise<void> {
    const children = await this.goalRepo.findChildren(parentGoalId);
    for (const child of children) {
      child.archive(); // 级联归档
      await this.goalRepo.save(child);
    }
  }
}