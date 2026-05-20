import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createInternalPowerSyncCredentials,
  purgePowerSyncClientId,
  vacuumSqliteIntoSnapshot,
} from './snapshot-builder.js';

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'powersync-builder-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.promises.rm(dir, { recursive: true, force: true })),
  );
});

describe('createInternalPowerSyncCredentials', () => {
  it('creates a signed RS256 token for the requested identity', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    const credentials = createInternalPowerSyncCredentials({
      identityId: 'identity-a',
      powersyncUrl: 'https://sync.example.test',
      privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
      keyId: 'snapshot-key',
      tokenExpiresInSeconds: 300,
    });

    expect(credentials.endpoint).toBe('https://sync.example.test');
    expect(credentials.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const payload = jwt.verify(
      credentials.token,
      publicKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
      {
        algorithms: ['RS256'],
        audience: 'powersync-dev',
      },
    ) as jwt.JwtPayload;

    expect(payload.sub).toBe('identity-a');
  });
});

describe('portable sqlite snapshot helpers', () => {
  it('removes client_id state and vacuums a portable sqlite copy', async () => {
    const tempDir = await createTempDir();
    const sourcePath = path.join(tempDir, 'source.sqlite');
    const snapshotPath = path.join(tempDir, 'portable.sqlite');

    const sourceDb = new DatabaseSync(sourcePath);
    sourceDb.exec(`
      CREATE TABLE ps_kv (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE example_items (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    `);
    sourceDb.prepare('INSERT INTO ps_kv (key, value) VALUES (?, ?)').run('client_id', 'abc123');
    sourceDb.prepare('INSERT INTO ps_kv (key, value) VALUES (?, ?)').run('keep_me', 'value');
    sourceDb.prepare('INSERT INTO example_items (id, name) VALUES (?, ?)').run('1', 'hello');

    const db = {
      execute: async (sql: string) => {
        const result = sourceDb.prepare(sql).run();
        return {
          rowsAffected: Number(result.changes),
        };
      },
    };

    await purgePowerSyncClientId(db as never);
    await vacuumSqliteIntoSnapshot(db as never, snapshotPath);
    sourceDb.close();

    const snapshotDb = new DatabaseSync(snapshotPath, { readonly: true });
    const clientId = snapshotDb.prepare('SELECT value FROM ps_kv WHERE key = ?').get('client_id');
    const keepMe = snapshotDb.prepare('SELECT value FROM ps_kv WHERE key = ?').get('keep_me') as {
      value: string;
    };
    const row = snapshotDb.prepare('SELECT name FROM example_items WHERE id = ?').get('1') as {
      name: string;
    };
    snapshotDb.close();

    expect(clientId).toBeUndefined();
    expect(keepMe.value).toBe('value');
    expect(row.name).toBe('hello');
  });
});
