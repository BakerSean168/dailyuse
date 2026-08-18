import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { detectHostEnvShadowing } from './env-shadow.mjs';
import {
  createLocalDockerAuthBaseUrl,
  createLocalDockerWebUrl,
  extractHttpOrigin,
  mergeLocalDockerWebOrigins,
  resolveLocalDockerBrowserValidationOrigins,
  resolveLocalDockerPowerSyncUrl,
} from './local-compose.mjs';

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
    assert.equal(
      warnings.some((warning) => warning.includes('DB_PASSWORD')),
      true,
    );
    assert.equal(
      warnings.some((warning) => warning.includes('NODE_ENV')),
      true,
    );
    assert.equal(
      warnings.some((warning) => warning.includes('JWT_SECRET')),
      false,
    );
  });

  it('is silent when host matches file or host key is unset', () => {
    const envFileMap = new Map([['DB_PASSWORD', 'same']]);
    assert.deepEqual(detectHostEnvShadowing({ DB_PASSWORD: 'same' }, envFileMap), []);
    assert.deepEqual(detectHostEnvShadowing({}, envFileMap), []);
  });
});

describe('mergeLocalDockerWebOrigins', () => {
  it('adds the resolved machine Web port to API and AI allowlists', () => {
    assert.deepEqual(
      mergeLocalDockerWebOrigins('12137', 'https://app.example.com,http://localhost:12137').split(
        ',',
      ),
      ['https://app.example.com', 'http://localhost:12137', 'http://127.0.0.1:12137'],
    );
  });
});

describe('MagicDNS browser-facing local Docker URLs', () => {
  it('normalizes the public Web URL into an allowlist origin', () => {
    const publicWebOrigin = extractHttpOrigin('http://oracle.taile92a8e.ts.net:58080/auth');
    assert.equal(publicWebOrigin, 'http://oracle.taile92a8e.ts.net:58080');
    assert.equal(
      mergeLocalDockerWebOrigins('58080', publicWebOrigin).includes(
        'http://oracle.taile92a8e.ts.net:58080',
      ),
      true,
    );
  });

  it('preserves an explicit public PowerSync URL instead of forcing localhost', () => {
    assert.equal(
      resolveLocalDockerPowerSyncUrl('58081', 'http://oracle.taile92a8e.ts.net:58081'),
      'http://oracle.taile92a8e.ts.net:58081',
    );
    assert.equal(resolveLocalDockerPowerSyncUrl('58081'), 'http://localhost:58081');
  });

  it('runs browser validation through the configured public Web and API origins', () => {
    assert.deepEqual(
      resolveLocalDockerBrowserValidationOrigins({
        apiHostPort: '53080',
        webHostPort: '58080',
        authBaseUrl: 'http://oracle.taile92a8e.ts.net:53080/api/auth',
        webUrl: 'http://oracle.taile92a8e.ts.net:58080',
      }),
      {
        apiOrigin: 'http://oracle.taile92a8e.ts.net:53080',
        webOrigin: 'http://oracle.taile92a8e.ts.net:58080',
      },
    );
  });
});

describe('createLocalDockerAuthBaseUrl', () => {
  it('uses the resolved machine API port for Better Auth callbacks', () => {
    assert.equal(createLocalDockerAuthBaseUrl('12136'), 'http://localhost:12136/api/auth');
  });
});

describe('createLocalDockerWebUrl', () => {
  it('uses the resolved machine Web port for device confirmation pages', () => {
    assert.equal(createLocalDockerWebUrl('12137'), 'http://localhost:12137');
  });
});

describe('API runtime image boundary', () => {
  it('deploys isolated API and migrator production closures', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile.api'), 'utf8');

    assert.doesNotMatch(dockerfile, /RUN[^\n]*pnpm fetch/);
    assert.ok(
      dockerfile.indexOf('COPY apps/api/package.json') <
        dockerfile.indexOf('pnpm --config.node-linker=isolated'),
    );
    assert.ok(
      dockerfile.indexOf('pnpm --config.node-linker=isolated') <
        dockerfile.indexOf('COPY apps/api ./apps/api'),
    );
    assert.ok(dockerfile.includes('pnpm --config.node-linker=isolated'));
    assert.ok(
      dockerfile.includes('--filter @memoflow/api deploy --prod --ignore-scripts /prod/api'),
    );
    assert.ok(
      dockerfile.includes(
        '--filter @memoflow/migrator deploy --prod --ignore-scripts /prod/migrator',
      ),
    );
    assert.ok(dockerfile.includes('COPY --from=builder /prod/api/node_modules ./node_modules'));
    assert.ok(!dockerfile.includes('COPY --from=builder /app/node_modules ./node_modules'));
    assert.ok(!dockerfile.includes('COPY --from=builder /app/packages ./packages'));

    const apiRuntime = dockerfile.slice(dockerfile.indexOf('FROM node-base AS api-runtime'));
    assert.ok(!apiRuntime.includes('packages/database'));
    assert.ok(!apiRuntime.includes('tsx'));
    assert.ok(!apiRuntime.includes('prisma'));
  });
});
