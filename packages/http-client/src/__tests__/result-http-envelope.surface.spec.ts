import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * First-party HTTP Result envelope surface (stage-6 residual 78/80):
 * ResultHttpClient, AxiosHttpClient, and mobile session refresh require
 * HttpResponse data envelopes — no raw dual-track business payloads.
 */
describe('first-party HTTP Result envelope surface', () => {
  const resultClient = readFileSync(resolve(__dirname, '../result-http-client.ts'), 'utf8');
  const axiosClient = readFileSync(resolve(__dirname, '../axios-http-client.ts'), 'utf8');
  const appSession = readFileSync(
    resolve(__dirname, '../../../app-react/src/providers/app-session-provider.tsx'),
    'utf8',
  );

  it('ResultHttpClient fails closed on non-envelope success bodies', () => {
    expect(resultClient).toContain('isHttpResponseEnvelope');
    expect(resultClient).toContain('fromHttpResponse');
    expect(resultClient).toContain('raw dual-track payloads are not accepted');
    expect(resultClient).not.toContain('return ok(data as T)');
    expect(resultClient).not.toContain('非标准信封 → 直接包装为 Result.ok');
  });

  it('ResultHttpClient requires data key for ok:true envelopes', () => {
    expect(resultClient).toContain('envelope.ok === true');
    expect(resultClient).toContain("return 'data' in envelope");
  });

  it('AxiosHttpClient fails closed on raw JSON dual-track success bodies', () => {
    expect(axiosClient).toContain('isHttpResponseEnvelope');
    expect(axiosClient).toContain('raw dual-track payloads are not accepted');
    expect(axiosClient).toContain('isNonJsonDownloadPayload');
    expect(axiosClient).not.toContain('非标准信封（例如第三方接口、文件下载）→ 原样返回');
  });

  it('app-react session refresh requires data envelope (no raw AuthResponseDTO)', () => {
    expect(appSession).toContain('MOBILE_API_BASE_URL');
    expect(appSession).toContain('/auth/refresh');
    expect(appSession).toContain("!('data' in json) || !json.data");
    expect(appSession).toContain('const data = json.data');
    expect(appSession).not.toContain('(json as AuthResponseDTO)');
    expect(appSession).not.toContain("'data' in json && json.data ? json.data :");
  });
});
