import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface PackagedWorkerPathOptions {
  isPackaged: boolean;
  existsSync?: (candidatePath: string) => boolean;
}

export function resolvePackagedWorkerPath(
  workerPath: string | URL,
  { isPackaged, existsSync = fs.existsSync }: PackagedWorkerPathOptions,
): string | URL {
  if (!isPackaged) return workerPath;

  const isFileUrl = workerPath instanceof URL && workerPath.protocol === 'file:';
  const filesystemPath =
    typeof workerPath === 'string' ? workerPath : isFileUrl ? fileURLToPath(workerPath) : null;
  if (!filesystemPath) return workerPath;

  const asarSegment = `${path.sep}app.asar${path.sep}`;
  if (!filesystemPath.includes(asarSegment)) return workerPath;

  const unpackedSegment = `${path.sep}app.asar.unpacked${path.sep}`;
  const candidatePath = filesystemPath.replace(asarSegment, unpackedSegment);
  if (!existsSync(candidatePath)) return workerPath;

  return isFileUrl ? pathToFileURL(candidatePath) : candidatePath;
}
