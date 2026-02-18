import type { Router, Express, RequestHandler } from 'express';

export interface SettingApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface SettingApiModuleDef {
  readonly name: string;
  register(context: SettingApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const SettingApiModule: SettingApiModuleDef = {
  name: 'Setting',
  register(_context) {
  },
};