import path from 'path';
import { ensureDesktopDataPath } from '../user-data-path';

const UNIFIED_DATABASE_FILENAME = 'dailyuse-sync.sqlite';

export function getUnifiedDatabasePath(): string {
  const dbDir = ensureDesktopDataPath();
  return path.join(dbDir, UNIFIED_DATABASE_FILENAME);
}
