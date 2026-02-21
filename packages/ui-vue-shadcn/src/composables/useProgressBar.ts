import { reactive, readonly } from 'vue';

interface ProgressBarState {
  /** Whether the bar is visible */
  active: boolean;
  /** Progress percentage 0-100 */
  progress: number;
}

const _state = reactive<ProgressBarState>({
  active: false,
  progress: 0,
});

let _timer: ReturnType<typeof setInterval> | null = null;
let _activeRequests = 0;

function _increment() {
  // Slow-down as we approach 90%
  if (_state.progress < 30) {
    _state.progress += 8;
  } else if (_state.progress < 60) {
    _state.progress += 4;
  } else if (_state.progress < 80) {
    _state.progress += 2;
  } else if (_state.progress < 90) {
    _state.progress += 0.5;
  }
  // Never exceed 90% automatically — completion via done()
}

function _startTimer() {
  if (_timer) return;
  _timer = setInterval(_increment, 200);
}

function _stopTimer() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

/** Read-only state for the progress bar component. */
export function _getProgressBarState(): Readonly<ProgressBarState> {
  return readonly(_state);
}

/**
 * Start the progress bar. Supports concurrent calls —
 * the bar stays active until all started requests call `progressDone()`.
 *
 * Use in:
 * - `router.beforeEach()` for route transitions
 * - Axios request interceptor for API calls
 *
 * @example
 * ```ts
 * import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn'
 *
 * router.beforeEach(() => { progressStart() })
 * router.afterEach(() => { progressDone() })
 * ```
 */
export function progressStart(): void {
  _activeRequests++;
  if (_activeRequests === 1) {
    _state.progress = 0;
    _state.active = true;
    _startTimer();
  }
}

/**
 * Complete the progress bar (jumps to 100% and fades out).
 */
export function progressDone(): void {
  _activeRequests = Math.max(0, _activeRequests - 1);
  if (_activeRequests === 0) {
    _stopTimer();
    _state.progress = 100;
    // Keep visible briefly, then hide
    setTimeout(() => {
      _state.active = false;
      _state.progress = 0;
    }, 400);
  }
}

/**
 * Force-finish the progress bar (e.g. on error).
 */
export function progressFinish(): void {
  _activeRequests = 0;
  _stopTimer();
  _state.progress = 100;
  setTimeout(() => {
    _state.active = false;
    _state.progress = 0;
  }, 400);
}
