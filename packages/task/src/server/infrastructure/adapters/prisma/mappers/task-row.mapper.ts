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

/** Legacy persistence default kept identical to the previous transport cast. */
const LEGACY_DEPENDENCY_STATUS_NONE = 'NONE' as DependencyStatus;

/**
 * Narrow a raw Prisma dependencyStatus string into the contract `DependencyStatus`.
 * Falls back to the legacy `'NONE'` marker for unknown/absent values, preserving
 * the exact runtime value the previous `as unknown as` cast produced.
 * 把原始 Prisma dependencyStatus 字符串收窄为 contract `DependencyStatus`；
 * 未知/缺失值回退到 legacy `'NONE'` 标记，保持与旧 `as unknown as` 强转一致的
 * 运行时值。
 */
export function toDependencyStatus(value: string | null | undefined): DependencyStatus {
  if (value && (DEPENDENCY_STATUS_VALUES as string[]).includes(value)) {
    return value as DependencyStatus;
  }
  return LEGACY_DEPENDENCY_STATUS_NONE;
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
