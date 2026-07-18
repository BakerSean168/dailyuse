import { API_CONFIG, TIMEOUT_CONFIG } from '../config';

export type CapturedEmailKind = 'email-verify' | 'password-reset';

/**
 * Poll the test-only API for the latest console-captured email code.
 * 轮询仅测试暴露的 API，读取控制台捕获的最近验证码。
 */
export async function waitForCapturedEmailCode(
  email: string,
  kind: CapturedEmailKind,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<string> {
  const timeoutMs = options?.timeoutMs ?? TIMEOUT_CONFIG.API_REQUEST * 3;
  const intervalMs = options?.intervalMs ?? 250;
  const deadline = Date.now() + timeoutMs;
  const url = new URL(`${API_CONFIG.FULL_URL}/auth/test/last-email-code`);
  url.searchParams.set('email', email);
  url.searchParams.set('kind', kind);

  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const body = (await response.json()) as {
          data?: { code?: string | null };
          code?: string | null;
        };
        const code = body.data?.code ?? body.code ?? null;
        if (typeof code === 'string' && /^\d{6}$/.test(code)) {
          return code;
        }
      } else {
        lastError = new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Timed out waiting for ${kind} code for ${email}: ${
      lastError instanceof Error ? lastError.message : String(lastError ?? 'no code')
    }`,
  );
}
