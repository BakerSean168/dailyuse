/**
 * ExampleStatus Value Object
 * 
 * 【规范说明：枚举类定义 - 来自项目规范文档】
 * 
 * 1. **不使用 TypeScript enum**
 *    - JSON 只有字符串，enum 会导致序列化问题（传 0 还是 "DRAFT"？）
 *    - enum 编译成 IIFE，增加构建体积；const object 零运行时开销
 *    - 字符串字面量更宽容，后端新增类型不会导致前端运行时错误
 * 
 * 2. **使用 const object as const**
 *    - 运行时可引用：ExampleStatus.Draft
 *    - 编译时类型安全：type ExampleStatusType
 *    - 必须添加 as const 锁定字面量类型
 * 
 * 3. **命名规范：PascalCase**
 *    - Key 和 Value 都使用 PascalCase（大驼峰）
 *    - 避免 SCREAMING_SNAKE_CASE（视觉干扰，仅用于环境变量）
 *    - 避免 camelCase（看起来像普通变量）
 *    - 格式：Draft: 'Draft' 一一对应
 * 
 * 4. **业务语义**
 *    - 每个状态都应该添加注释说明业务含义
 *    - 包含状态机转换规则
 */

/**
 * 示例模块的生命周期状态
 * 
 * 状态机转换：
 * Draft → Active → Archived
 * 或
 * Draft → Rejected → Archived
 */
export const ExampleStatus = {
  /**
   * 草稿状态：刚创建，还未激活
   * - 在此状态下可以随意编辑所有字段
   * - 不会触发任何业务规则校验
   */
  Draft: 'Draft',

  /**
   * 活跃状态：已发布并生效
   * - 某些字段变成只读（如 name 需要管理员权限修改）
   * - 开始记录审计日志
   * - 触发关联业务逻辑
   */
  Active: 'Active',

  /**
   * 已拒绝状态：创建过程中被拒绝
   * - 用于 workflow 场景，类似 code review 被拒
   * - 可以返回 Draft 重新编辑后重新提交
   */
  Rejected: 'Rejected',

  /**
   * 已归档状态：不再使用，但保留历史数据
   * - 对大多数查询隐藏（需要显式过滤器）
   * - 不允许修改
   * - 允许硬删除（符合 GDPR 要求时）
   */
  Archived: 'Archived',
} as const;

/**
 * 【规范说明：类型导出】
 * 从 const object 提取类型，确保类型和值自动同步
 * 导出的类型名字和 const object 名字一致，不用加后缀
 * 
 * ExampleStatus = 'Draft' | 'Active' | 'Rejected' | 'Archived'
 * 
 * 这样的好处：
 * - 单一数据源：修改 ExampleStatus 对象，类型自动更新
 * - 编译时检查：防止拼写错误
 * - IDE 自动完成：所有状态值都有提示
 */
export type ExampleStatus = typeof ExampleStatus[keyof typeof ExampleStatus];

