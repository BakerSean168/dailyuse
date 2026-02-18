import type { Router, Express, RequestHandler } from 'express';

export interface RepositoryApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface RepositoryApiModuleDef {
  readonly name: string;
  register(context: RepositoryApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const RepositoryApiModule: RepositoryApiModuleDef = {
  name: 'Repository',
  register(_context) {
  },
};