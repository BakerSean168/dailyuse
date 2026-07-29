/**
 * Lifecycle subpath — initialization and module-loading primitives.
 *
 * @module @memoflow/utils/lifecycle
 */

export {
  InitializationPhase,
  InitializationManager,
  type InitializationTask,
} from '../initialization-manager';

export {
  WebInitializationManager,
  ModuleGroup,
  type ModuleLoader,
  type ModuleDefinition,
  type LoadingProgress,
} from '../web-initialization-manager';
