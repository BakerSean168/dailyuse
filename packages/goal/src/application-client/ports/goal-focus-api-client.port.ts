/**
 * Goal Focus API Client Port
 *
 * Transport-agnostic interface for Goal Focus Mode API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 */

import type { Result } from '@memoflow/contracts/result';
import type {
  FocusModeDTO,
  ActivateFocusModeRequest,
} from '@memoflow/contracts/goal';

export interface IGoalFocusApiClient {
  getCurrentFocusMode(): Promise<Result<FocusModeDTO | null>>;
  activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeDTO>>;
  deactivateFocusMode(): Promise<Result<FocusModeDTO | null>>;
  extendFocusMode(request: { newEndTime: number }): Promise<Result<FocusModeDTO>>;
}
