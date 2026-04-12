import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { LoggerFactory, createLogger } from '@dailyuse/utils';
import { WinstonLogger } from '@dailyuse/utils/winston';
import { configureDesktopUserDataPath } from './user-data-path';

const configuredUserDataPath = configureDesktopUserDataPath();
const logDir = path.join(configuredUserDataPath, 'logs');

process.env.LOG_DIR = logDir;

fs.mkdirSync(logDir, { recursive: true });

LoggerFactory.registerProvider((context) => new WinstonLogger(context));
LoggerFactory.configure({ enableInProduction: true, level: 'info' });

const logger = createLogger('DesktopRuntime');

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in Electron main process', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in Electron main process', reason);
});

app.on('render-process-gone', (_event, _webContents, details) => {
  logger.error('Renderer process exited unexpectedly', details);
});

export function getConfiguredDesktopUserDataPath(): string {
  return configuredUserDataPath;
}
