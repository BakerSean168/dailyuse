/**
 * RuleId 品牌化 ID 类型
 *
 * 【规范说明：Type 类型值对象 - 参考 domain-shared-type-value-object-spec.md】
 *
 * 使用 @dailyuse/utils 的 createIdType 工具创建 ID 类型实例
 * - 编译时类型安全（防止 ID 类型混淆）
 * - 运行时就是普通 string（零开销）
 * - 提供统一的工厂方法和校验
 *
 * 【为什么需要品牌化 ID？】
 * ```typescript
 * // 没有品牌化：容易混淆
 * function getUser(userId: string, orderId: string) { ... }
 * getUser(orderId, userId); // 编译通过，但参数传反了！
 *
 * // 有品牌化：编译时检查
 * function getUser(userId: UserId, orderId: OrderId) { ... }
 * getUser(orderId, userId); // ❌ 编译错误！
 * ```
 */

import type { RuleId as IRuleId } from '../../contracts/primitives/ids';

import { createIdType } from '@dailyuse/utils/domain';

/**
 * RuleId 工具对象
 *
 * 提供方法：
 * - of(value: string): RuleId - 从 string 创建（包含校验）
 * - generate(): RuleId - 生成新 ID
 * - isValid(value: string): boolean - 校验 ID 格式
 * - tryParse(value: string): RuleId | null - 安全创建
 * - toString(id: RuleId): string - 转为普通 string
 *
 * @example
 * ```typescript
 * // 生成新 ID
 * const newId = RuleId.generate();
 * // 'ex_550e8400-e29b-41d4-a716-446655440000'
 *
 * // 从已有 string 创建
 * const id = RuleId.of('ex_abc123');
 *
 * // 安全解析
 * const maybeId = RuleId.tryParse(userInput);
 * if (maybeId) {
 *   console.log('Valid ID:', maybeId);
 * }
 * ```
 */
export const RuleId = createIdType<IRuleId>('RuleId');

/**
 * RuleId 类型
 *
 * 本质是 string，但通过 Brand 标记使其与其他 string 类型不兼容
 */
export type RuleId = IRuleId;
