/**
 * Task Row Mappers
 * 任务行 Mapper
 *
 * Named boundary mappers for Prisma/PowerSync row → domain conversions that
 * narrow string columns into the shared contract enum types. Each mapper is
 * the single typed conversion point so the boundary never leaks `as unknown as`
 * casts into transport/domain code.
 *
 * Prisma/PowerSync 行 → domain 转换的命名边界 mapper：把字符串列收窄为共享
 * contract enum 类型。每个 mapper 是唯一类型转换点，使边界不会向
 * transport/domain 泄漏 `as unknown as` 强转。
 */

import { DependencyStatus } from '@memoflow/contracts/task';
import { ImportanceLevel } from '@memoflow/contracts/shared';

const DEPENDENCY_STATUS_VALUES = Object.values(DependencyStatus);
const IMPORTANCE_LEVEL_VALUES = Object.values(ImportanceLevel);

/**
 * Narrow a raw Prisma dependencyStatus string into the contract `DependencyStatus`.
 * Unknown/absent values fall back to the legal `DependencyStatus.None` so the
 * emitted value always stays inside the declared contract enum.
 * 把原始 Prisma dependencyStatus 字符串收窄为 contract `DependencyStatus`；
 * 未知/缺失值回退到合法的 `DependencyStatus.None`，确保输出值始终处于声明的
 * contract enum 之内。
 */
export function toDependencyStatus(value: string | null | undefined): DependencyStatus {
  if (value && (DEPENDENCY_STATUS_VALUES as string[]).includes(value)) {
    return value as DependencyStatus;
  }
  return DependencyStatus.None;
}

/**
 * Narrow a raw Prisma/PowerSync importance string into the contract
 * `ImportanceLevel`. Falls back to `'Moderate'` for unknown/absent values.
 * 把原始 Prisma/PowerSync importance 字符串收窄为 contract `ImportanceLevel`；
 * 未知/缺失值回退到 `'Moderate'`。
 */
export function toImportanceLevel(value: string | null | undefined): ImportanceLevel {
  if (value && (IMPORTANCE_LEVEL_VALUES as string[]).includes(value)) {
    return value as ImportanceLevel;
  }
  return ImportanceLevel.Moderate;
}
