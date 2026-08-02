interface MatchedRouteIdentity {
  name?: unknown;
  path?: string;
  components?: Record<string, unknown> | null;
}

/**
 * Use the first route record after AppShell that actually renders a component.
 * Goal therefore shares one cached ModuleLayout across list/detail routes,
 * while Task (whose parent record has no component) distinguishes its leaves.
 */
export function resolvePanelRouteIdentity(
  matched: readonly MatchedRouteIdentity[],
  fallback: string,
): string {
  const renderedRecord = matched.slice(1).find((record) => record.components?.default != null);
  const identity = renderedRecord ?? matched[1] ?? matched[matched.length - 1];
  return String(identity?.name ?? identity?.path ?? fallback);
}
