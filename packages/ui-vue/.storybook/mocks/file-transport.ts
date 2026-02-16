import type { LogEntry, LogLevel, LogTransport } from '@dailyuse/utils/src/logger/types';

export interface FileTransportOptions {
  level?: LogLevel;
  filename: string;
  json?: boolean;
}

export class FileTransport implements LogTransport {
  name = 'file';
  level: LogLevel;

  constructor(options: FileTransportOptions) {
    this.level = options.level ?? 2;
  }

  log(_entry: LogEntry): void {
    // no-op in browser/storybook
  }
}
