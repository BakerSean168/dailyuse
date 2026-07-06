/**
 * Governance server transport layer.
 * Governance 服务端传输层。
 *
 * Owns transport-shared controller logic.
 * HTTP and Electron adapt their entrypoints through this slice.
 *
 * 负责传输层共享控制器逻辑，
 * HTTP 与 Electron 都通过这里接入。
 */

export { GovernanceController } from './governance.controller';