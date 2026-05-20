/**
 * Authentication Module — Electron Entry Point.
 * 认证模块 — Electron 入口点。
 *
 * @deprecated This entry point is fully superseded by
 * `desktop-auth-shell` in apps/desktop. It is no longer exported
 * because registering both modules would cause duplicate ipcMain.handle()
 * calls on the same channels, crashing the process.
 *
 * @deprecated 此入口已被 apps/desktop 中的 `desktop-auth-shell` 完全取代。
 * 不再导出该模块，因为同时注册两个模块会导致 ipcMain.handle() 在相同通道上
 * 重复注册，从而使进程崩溃。
 *
 * @see apps/desktop/src/main/modules/authentication/desktop-auth-shell.ts
 * @module authentication/electron-entry
 */

// Intentionally empty — no exports.
// 有意留空 — 无导出。
//
// Previously exported `AuthenticationElectronModule` which registered
// IPC handlers returning NOT_SUPPORTED on auth:* channels. Those channels
// are now exclusively owned by the desktop shell auth handlers and registering
// duplicates would throw at runtime.
// 之前导出的 AuthenticationElectronModule 会在 auth:* 通道上注册返回
// NOT_SUPPORTED 的 IPC 处理器。这些通道现在专属于 desktop shell auth handlers，
// 重复注册会导致运行时错误。
export {};
