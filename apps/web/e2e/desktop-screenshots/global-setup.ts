import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDesktopApp } from '../helpers/build-desktop';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');

export default async function globalSetup(): Promise<void> {
  buildDesktopApp(workspaceRoot);
}
