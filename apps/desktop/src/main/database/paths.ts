import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const UNIFIED_DATABASE_FILENAME = 'dailyuse-sync.sqlite';

export function getUnifiedDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, UNIFIED_DATABASE_FILENAME);
}
