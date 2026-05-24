// Environment Configuration for Utils package
export interface IEnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_URL?: string;
  API_TIMEOUT?: number;
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}

declare const process: any;

export class EnvConfig implements IEnvConfig {
  public readonly NODE_ENV: 'development' | 'production' | 'test';
  public readonly API_URL?: string;
  public readonly API_TIMEOUT?: number;
  public readonly LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';

  constructor() {
    // 在 Node.js 环境中使用 process.env
    if (typeof process !== 'undefined' && process.env) {
      this.NODE_ENV = (process.env.NODE_ENV as any) || 'development';
      this.API_URL = process.env.API_URL;
      this.API_TIMEOUT = process.env.API_TIMEOUT ? parseInt(process.env.API_TIMEOUT) : undefined;
      this.LOG_LEVEL = (process.env.LOG_LEVEL as any) || 'info';
    } else {
      // 在浏览器环境中使用默认值
      this.NODE_ENV = 'development';
      this.LOG_LEVEL = 'info';
    }
  }

  public isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.NODE_ENV === 'test';
  }
}

export const envConfig = new EnvConfig();
