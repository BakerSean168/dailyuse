import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectHostEnvShadowing } from './env-shadow.mjs';
import { mergeLocalDockerWebOrigins } from './local-compose.mjs';

describe('detectHostEnvShadowing', () => {
  it('warns when host process env differs from env-file for critical keys', () => {
    const envFileMap = new Map([
      ['DB_PASSWORD', 'file-password'],
      ['JWT_SECRET', 'file-jwt'],
      ['NODE_ENV', 'production'],
    ]);
    const warnings = detectHostEnvShadowing(
      {
        DB_PASSWORD: 'host-password',
        JWT_SECRET: 'file-jwt',
        NODE_ENV: 'development',
      },
      envFileMap,
    );
    expect(warnings.some((warning) => warning.includes('DB_PASSWORD'))).toBe(true);
    expect(warnings.some((warning) => warning.includes('NODE_ENV'))).toBe(true);
    expect(warnings.some((warning) => warning.includes('JWT_SECRET'))).toBe(false);
  });

  it('is silent when host matches file or host key is unset', () => {
    const envFileMap = new Map([['DB_PASSWORD', 'same']]);
    expect(detectHostEnvShadowing({ DB_PASSWORD: 'same' }, envFileMap)).toEqual([]);
    expect(detectHostEnvShadowing({}, envFileMap)).toEqual([]);
  });
});

describe('mergeLocalDockerWebOrigins', () => {
  it('adds the resolved machine Web port to API and AI allowlists', () => {
    expect(
      mergeLocalDockerWebOrigins('12137', 'https://app.example.com,http://localhost:12137').split(
        ',',
      ),
    ).toEqual(['https://app.example.com', 'http://localhost:12137', 'http://127.0.0.1:12137']);
  });
});

describe('API runtime image boundary', () => {
  it('deploys isolated API and migrator production closures', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile.api'), 'utf8');

    expect(dockerfile).not.toMatch(/RUN[^\n]*pnpm fetch/);
    expect(dockerfile.indexOf('COPY apps/api/package.json')).toBeLessThan(
      dockerfile.indexOf('pnpm --config.node-linker=isolated'),
    );
    expect(dockerfile.indexOf('pnpm --config.node-linker=isolated')).toBeLessThan(
      dockerfile.indexOf('COPY apps/api ./apps/api'),
    );
    expect(dockerfile).toContain('pnpm --config.node-linker=isolated');
    expect(dockerfile).toContain('--filter @memoflow/api deploy --prod --ignore-scripts /prod/api');
    expect(dockerfile).toContain(
      '--filter @memoflow/migrator deploy --prod --ignore-scripts /prod/migrator',
    );
    expect(dockerfile).toContain('COPY --from=builder /prod/api/node_modules ./node_modules');
    expect(dockerfile).not.toContain('COPY --from=builder /app/node_modules ./node_modules');
    expect(dockerfile).not.toContain('COPY --from=builder /app/packages ./packages');

    const apiRuntime = dockerfile.slice(dockerfile.indexOf('FROM node-base AS api-runtime'));
    expect(apiRuntime).not.toContain('packages/database');
    expect(apiRuntime).not.toContain('tsx');
    expect(apiRuntime).not.toContain('prisma');
  });
});
