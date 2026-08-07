/**
 * Shell Scene 语义（Phase 0 / 诊断 UI-007）
 *
 * Settings / Account 是独立设置场景（STATE D）：不创建 BusinessTab、不修改
 * layout；workspace scene host 保持常驻（不因设置导航销毁 KeepAlive/AI 实例）。
 *
 * 该判定同时被 useShellRouterSync（路由同步）、AppShell（场景外壳）和
 * settings scene guard（统一离开协议）消费，因此独立成模块避免循环依赖。
 */
export function isStandaloneSettingsPath(path: string): boolean {
  const bare = path.split('?')[0] ?? path;
  return (
    bare === '/settings' ||
    bare.startsWith('/settings/') ||
    bare === '/account' ||
    bare.startsWith('/account/')
  );
}
