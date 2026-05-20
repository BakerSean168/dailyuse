import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  readUserFilesConfig,
  writeUserFilesConfig,
  getCustomUserFilesRoot,
  setCustomUserFilesRoot,
} from './user-files-config';

describe('user-files-config', () => {
  let configDir: string;

  beforeEach(async () => {
    configDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'user-files-config-'));
  });

  afterEach(async () => {
    await fs.promises.rm(configDir, { recursive: true, force: true });
  });

  it('readUserFilesConfig returns empty object when config file does not exist', () => {
    const config = readUserFilesConfig(configDir);
    expect(config).toEqual({});
  });

  it('writeUserFilesConfig creates config file and readUserFilesConfig reads it back', () => {
    writeUserFilesConfig(configDir, { customRootPath: '/custom/path' });

    const config = readUserFilesConfig(configDir);
    expect(config.customRootPath).toBe('/custom/path');
  });

  it('getCustomUserFilesRoot returns undefined when not configured', () => {
    expect(getCustomUserFilesRoot(configDir)).toBeUndefined();
  });

  it('setCustomUserFilesRoot persists a custom path and getCustomUserFilesRoot retrieves it', () => {
    setCustomUserFilesRoot(configDir, '/my/custom/dir');
    expect(getCustomUserFilesRoot(configDir)).toBe('/my/custom/dir');
  });

  it('setCustomUserFilesRoot with null clears the custom path', () => {
    setCustomUserFilesRoot(configDir, '/my/custom/dir');
    expect(getCustomUserFilesRoot(configDir)).toBe('/my/custom/dir');

    setCustomUserFilesRoot(configDir, null);
    expect(getCustomUserFilesRoot(configDir)).toBeUndefined();
  });

  it('setCustomUserFilesRoot preserves other config fields', () => {
    // Write initial config with extra fields
    const configPath = path.join(configDir, 'user-files-config.json');
    fs.writeFileSync(configPath, JSON.stringify({ customRootPath: '/old', extra: 'value' }), 'utf8');

    setCustomUserFilesRoot(configDir, '/new');

    const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(rawConfig.customRootPath).toBe('/new');
    expect(rawConfig.extra).toBe('value');
  });

  it('readUserFilesConfig returns empty object for corrupt JSON', () => {
    const configPath = path.join(configDir, 'user-files-config.json');
    fs.writeFileSync(configPath, '{bad json!!!', 'utf8');

    const config = readUserFilesConfig(configDir);
    expect(config).toEqual({});
  });

  it('writeUserFilesConfig creates parent directory if it does not exist', () => {
    const nestedDir = path.join(configDir, 'nested', 'config');
    writeUserFilesConfig(nestedDir, { customRootPath: '/test' });

    const config = readUserFilesConfig(nestedDir);
    expect(config.customRootPath).toBe('/test');
  });
});
