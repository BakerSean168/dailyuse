import fs from 'node:fs';
import path from 'node:path';

interface UserFilesConfig {
  customRootPath?: string;
}

const CONFIG_FILENAME = 'user-files-config.json';

function getConfigPath(configDir: string): string {
  return path.join(configDir, CONFIG_FILENAME);
}

export function readUserFilesConfig(configDir: string): UserFilesConfig {
  const configPath = getConfigPath(configDir);
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeUserFilesConfig(configDir: string, config: UserFilesConfig): void {
  const configPath = getConfigPath(configDir);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

export function getCustomUserFilesRoot(configDir: string): string | undefined {
  const config = readUserFilesConfig(configDir);
  return config.customRootPath;
}

export function setCustomUserFilesRoot(configDir: string, customPath: string | null): void {
  const config = readUserFilesConfig(configDir);
  if (customPath) {
    config.customRootPath = customPath;
  } else {
    delete config.customRootPath;
  }
  writeUserFilesConfig(configDir, config);
}
