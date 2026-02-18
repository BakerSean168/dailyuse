import type { Router, Express, RequestHandler } from 'express';

export interface NotificationApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface NotificationApiModuleDef {
  readonly name: string;
  register(context: NotificationApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const NotificationApiModule: NotificationApiModuleDef = {
  name: 'Notification',
  register(_context) {
  },
};