import type { Router, Express, RequestHandler } from 'express';

export interface EditorApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface EditorApiModuleDef {
  readonly name: string;
  register(context: EditorApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const EditorApiModule: EditorApiModuleDef = {
  name: 'Editor',
  register(_context) {
  },
};