/**
 * PowerSync Mappers - Barrel Export.
 * PowerSync 映射器 - 统一导出。
 *
 * @internal All mapper types are persistence implementation details.
 * @internal 所有映射器类型均为持久化实现细节。
 */

/** @internal */
export {
  PowerSyncRuleMapper,
  type PowerSyncRuleRow,
  type PowerSyncRuleWriteRow,
} from './powersync-rule.mapper';
/** @internal */
export {
  PowerSyncRuleRevisionMapper,
  type PowerSyncRuleRevisionRow,
  type PowerSyncRuleRevisionWriteRow,
} from './powersync-rule-revision.mapper';
