/**
 * Assistant dispatch fallback policy (plan §4.5, residual 351).
 * Assistant dispatch 回退策略（计划 §4.5，residual 351）。
 *
 * Host dispatch is ALWAYS the default; a legacy `streamMessage` fallback is a
 * narrow version-compatibility adapter that lives only inside AIClientService.
 * This module is the single pure decision point: unknown values fail closed.
 *
 * Host dispatch 始终是默认；legacy `streamMessage` 回退只是 AIClientService
 * 内部的窄版本兼容 adapter。本模块是唯一的纯判定点：未知值一律 fail-closed。
 */
import type { AssistantClientCommand } from '@memoflow/contracts/ai';
import { ASSISTANT_DISPATCH_UNAVAILABLE } from '@memoflow/contracts/ai';
import { extractStructuredResultError } from '@memoflow/contracts/result';

/**
 * Host-provided rollout policy (plan §4.5 / §5.5 Step D).
 * Host 提供的发布策略（计划 §4.5 / §5.5 Step D）。
 *
 * - `prefer_dispatch`: dispatch first; fallback to legacy only when dispatch is
 *   definitely unavailable and produced zero events. Production default.
 *   `prefer_dispatch`：先 dispatch；仅在 dispatch 明确不可用且未产生任何事件时
 *   回退 legacy。生产默认。
 * - `dispatch_only`: never fall back; diagnostic / forced-Host mode.
 *   `dispatch_only`：永不回退；诊断 / 强制 Host 模式。
 * - `legacy_only`: bypass dispatch; direct-turn messages only. pi_readonly and
 *   proposal/cancel commands fail explicitly. Emergency rollback switch.
 *   `legacy_only`：绕过 dispatch；仅 direct-turn message。pi_readonly 与
 *   proposal/cancel 明确失败。紧急回滚开关。
 */
export type AssistantDispatchPolicy = 'prefer_dispatch' | 'dispatch_only' | 'legacy_only';

/** Production default policy. 生产默认策略。 */
export const DEFAULT_ASSISTANT_DISPATCH_POLICY: AssistantDispatchPolicy = 'prefer_dispatch';

/**
 * Observable state of a dispatch attempt used for fallback decisions.
 * 用于回退判定的 dispatch 尝试观测状态。
 */
export interface AssistantDispatchObservedState {
  /**
   * Whether dispatch emitted at least one AssistantEvent before failing.
   * Once an event is seen (especially `run.started`) the Host may have acted,
   * so a legacy retry must never happen.
   *
   * 失败前 dispatch 是否至少产出过一个 AssistantEvent。只要看到事件
   * （尤其是 `run.started`），Host 就可能已经执行，因此绝不能重试 legacy。
   */
  sawEvent: boolean;
}

/**
 * Decide whether a failed dispatch may fall back to the legacy message stream.
 * Implements ONLY the §4.5 whitelist; every unknown error / command / observed
 * state fails closed (returns false).
 *
 * 判定一次失败的 dispatch 是否可以回退到 legacy message 流。只实现 §4.5
 * 白名单；任何未知的错误 / command / 观测状态都 fail-closed（返回 false）。
 *
 * Eligible ONLY when:
 * 仅当以下全部成立才 eligible：
 * - command is `message` with `direct_turn` (or default) profile — proposal /
 *   `cancel_run` / `pi_readonly` never fall back;
 *   command 为 `message` 且 profile 为 `direct_turn`（或缺省）——proposal /
 *   `cancel_run` / `pi_readonly` 永不回退；
 * - dispatch produced zero AssistantEvent;
 *   dispatch 未产出任何 AssistantEvent；
 * - the error is the stable dispatch-unavailable code (bootstrap route absence
 *   404/405/501, or Desktop bridge/handler absence before START acceptance).
 *   错误是稳定的 dispatch-unavailable 码（bootstrap 路由缺失 404/405/501，或
 *   Desktop bridge/handler 在 START 接受前缺失）。
 */
export function classifyAssistantDispatchFallback(
  error: unknown,
  command: AssistantClientCommand,
  observed: AssistantDispatchObservedState,
): boolean {
  // Fail closed on any non-message command.
  if (command.type !== 'message') return false;
  // pi_readonly never maps to a legacy direct chat send.
  if (command.executionProfileId === 'pi_readonly') return false;
  // Any observed event — especially run.started — means the Host may have acted.
  if (observed.sawEvent) return false;

  const code = readErrorCode(error);
  return code === ASSISTANT_DISPATCH_UNAVAILABLE;
}

function readErrorCode(error: unknown): string | undefined {
  const structured = extractStructuredResultError(error);
  return typeof structured?.code === 'string' && structured.code.length > 0
    ? structured.code
    : undefined;
}
