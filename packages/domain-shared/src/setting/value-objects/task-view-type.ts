import type { TaskViewType as ITaskViewType } from '@dailyuse/contracts/setting';

/**
 * 📝 任务视图类型 - 任务的显示视图类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type TaskViewType = ITaskViewType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ITaskViewType[] = ['List', 'Kanban', 'Calendar'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const TaskViewType = {
  // ================= 常量定义 =================
  
  List: 'List' as TaskViewType,
  Kanban: 'Kanban' as TaskViewType,
  Calendar: 'Calendar' as TaskViewType,

  // ================= 工厂方法 =================

  of(value: string): TaskViewType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TaskViewType: ${value}`);
    }
    return value as TaskViewType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is TaskViewType {
    return VALUES.includes(value as ITaskViewType);
  },

  // ================= 遍历方法 =================

  getAll(): TaskViewType[] {
    return VALUES as TaskViewType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为列表视图
   */
  isList(value: TaskViewType): boolean {
    return value === 'List';
  },

  /**
   * 判断是否为看板视图
   */
  isKanban(value: TaskViewType): boolean {
    return value === 'Kanban';
  },

  /**
   * 判断是否为日历视图
   */
  isCalendar(value: TaskViewType): boolean {
    return value === 'Calendar';
  },
};
