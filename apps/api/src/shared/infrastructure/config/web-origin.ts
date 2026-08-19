/**
 * O2V-01 keep-boundary: the MagicDNS public Web origin must be accepted by the
 * API Better Auth trusted origins and CORS middleware even when it is not
 * explicitly listed in CORS_ORIGIN. Derivation lives OUTSIDE `getCorsOrigins()`
 * (residual 1189 keep-boundary pins that function to split/trim/filter only).
 *
 * 从 MEMOFLOW_WEB_URL 推导公开 Web origin 的辅助函数。保留在 getCorsOrigins()
 * 之外，避免破坏 residual 1189 的 keep-boundary 表面契约。
 */

/**
 * Normalize MEMOFLOW_WEB_URL into its origin (scheme://host[:port]) with the
 * trailing path stripped. Returns undefined when the value is absent or not a
 * parseable URL so callers keep the previous behavior unchanged.
 */
export function deriveWebOrigin(webUrl: string | undefined): string | undefined {
  if (!webUrl) return undefined;
  try {
    return new URL(webUrl).origin;
  } catch {
    return undefined;
  }
}

/**
 * Merge the API CORS/trusted-origins list with the MEMOFLOW_WEB_URL-derived
 * origin, deduped. Without MEMOFLOW_WEB_URL the input list is returned
 * unchanged (fresh array copy).
 */
export function getTrustedWebOrigins(
  corsOrigins: readonly string[],
  webUrl: string | undefined,
): string[] {
  const webOrigin = deriveWebOrigin(webUrl);
  return webOrigin ? [...new Set([...corsOrigins, webOrigin])] : [...corsOrigins];
}
