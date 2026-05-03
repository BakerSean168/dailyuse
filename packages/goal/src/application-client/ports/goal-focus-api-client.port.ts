/**
 * Goal Focus API Client Port
 *
 * Transport-agnostic interface for Goal Focus Mode API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  FocusModeClientDTO,
  ActivateFocusModeRequest,
} from '@dailyuse/contracts/goal';

export interface IGoalFocusApiClient {
  getCurrentFocusMode(): Promise<Result<FocusModeClientDTO | null>>;
  activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeClientDTO>>;
  deactivateFocusMode(): Promise<Result<FocusModeClientDTO | null>>;
  extendFocusMode(request: { newEndTime: number }): Promise<Result<FocusModeClientDTO>>;
}
