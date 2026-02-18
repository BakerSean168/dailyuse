import type { Router, Express, RequestHandler } from 'express';

export interface ScheduleApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface ScheduleApiModuleDef {
  readonly name: string;
  register(context: ScheduleApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const ScheduleApiModule: ScheduleApiModuleDef = {
  name: 'Schedule',
  register(_context) {
  },
};