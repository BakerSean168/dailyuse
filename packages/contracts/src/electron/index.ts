/**
 * Electron Module Contract
 *
 * Defines the interface for self-contained Electron main process modules.
 * Each business module implements this to perform its own Composition Root.
 *
 * @module contracts/electron
 */

import type Database from 'better-sqlite3';
import type { Context } from '../shared';
export type { IElectronAuthContext } from './auth-context';
import type { IElectronAuthContext } from './auth-context';

/**
 * Shared context provided to every Electron module during registration.
 */
export interface IElectronModuleContext {
  /** The active better-sqlite3 database instance. */
  readonly db: Database.Database;
  /** Shared authenticated desktop session context. */
  readonly auth: IElectronAuthContext;
}

/**
 * A self-contained Electron main-process module.
 */
export interface IElectronModule {
  /** Human-readable module name (used in logs). */
  readonly name: string;

  /**
   * Composition Root — wire up repositories, domain services,
   * application services, and IPC handlers.
   */
  register(context: IElectronModuleContext): Promise<void> | void;

  /**
   * Graceful shutdown — release resources, remove IPC handlers, etc.
   */
  destroy?(): Promise<void> | void;
}
