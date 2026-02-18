import type { Router, Express, RequestHandler } from 'express';

export interface ReminderApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface ReminderApiModuleDef {
  readonly name: string;
  register(context: ReminderApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const ReminderApiModule: ReminderApiModuleDef = {
  name: 'Reminder',
  register(_context) {
  },
};