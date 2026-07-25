import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Authentication void-success envelope surface (stage-6 residual 94):
 * void auth mutations use z.null()/ok(null) — no z.void() or Result.void dual-track.
 */
describe('authentication void success envelope surface', () => {
  const routes = readFileSync(resolve(__dirname, './routes.ts'), 'utf8');
  const controller = readFileSync(
    resolve(__dirname, '../server/transport/authentication.controller.ts'),
    'utf8',
  );

  it('OpenAPI void responses use z.null(), not z.void()', () => {
    expect(routes).toContain("successResponse(z.null(), '解绑成功')");
    expect(routes).toContain("successResponse(z.null(), '登出成功')");
    expect(routes).toContain("successResponse(z.null(), '撤销成功')");
    expect(routes).toContain("successResponse(z.null(), '密码修改成功')");
    expect(routes).toContain("successResponse(z.null(), '请求已接收')");
    expect(routes).toContain("successResponse(z.null(), '密码重置成功')");
    expect(routes).not.toContain('z.void()');
  });

  it('controller returns ok(null) for void mutations', () => {
    for (const method of [
      'unbindOAuth',
      'logout',
      'revokeSession',
      'changePassword',
      'forgotPassword',
      'resetPassword',
      'sendEmailCode',
    ]) {
      expect(controller).toMatch(
        new RegExp(`async ${method}[\\s\\S]*?Promise<Result<null>>`),
      );
    }
    expect((controller.match(/return ok\(null\)/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });
});
