/**
 * Repository Electron seam.
 *
 * Owns desktop-main registration for the repository runtime.
 */
import { ipcMain } from 'electron';
import {
  RepositoryChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import type {
  ExecuteKnowledgeRepositoryReconciliationRes,
  KnowledgeRepositoryContentState,
  KnowledgeRepositoryReconciliationPreview,
  SyncKnowledgeRepositoryRes,
} from '@dailyuse/contracts/repository';
import { fail, ok, type Result } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import { withAuthenticatedValue } from './authenticated-ipc';
import { LocalVaultRuntimeError, type LocalVaultElectronPort } from './local-vault-runtime';
import type { IRepositoryApiClient } from '../application-client/ports/repository-api-client.port';

export {
  createLocalVaultRuntime,
  LocalVaultRuntime,
  LocalVaultRuntimeError,
  type LocalVaultElectronPort,
  type LocalVaultPlatform,
  type LocalVaultRuntimeOptions,
} from './local-vault-runtime';

const logger = createLogger('RepositoryElectron');

const Ch = {
  KNOWLEDGE_CONNECTION_INSTALLATION_START:
    RepositoryChannels.KNOWLEDGE_CONNECTION_INSTALLATION_START,
  KNOWLEDGE_CONNECTION_INSTALLATION_COMPLETE:
    RepositoryChannels.KNOWLEDGE_CONNECTION_INSTALLATION_COMPLETE,
  KNOWLEDGE_CONNECTION_LIST: RepositoryChannels.KNOWLEDGE_CONNECTION_LIST,
  KNOWLEDGE_CONNECTION_CONNECT: RepositoryChannels.KNOWLEDGE_CONNECTION_CONNECT,
  KNOWLEDGE_CONNECTION_DISCONNECT: RepositoryChannels.KNOWLEDGE_CONNECTION_DISCONNECT,
  KNOWLEDGE_CONNECTION_RECONCILIATION_PREVIEW:
    RepositoryChannels.KNOWLEDGE_CONNECTION_RECONCILIATION_PREVIEW,
  KNOWLEDGE_CONNECTION_RECONCILIATION_EXECUTE:
    RepositoryChannels.KNOWLEDGE_CONNECTION_RECONCILIATION_EXECUTE,
  KNOWLEDGE_CONNECTION_SYNC: RepositoryChannels.KNOWLEDGE_CONNECTION_SYNC,
  KNOWLEDGE_CONNECTION_DESKTOP_TOKEN: RepositoryChannels.KNOWLEDGE_CONNECTION_DESKTOP_TOKEN,
  LOCAL_VAULT_GET: 'repository:local-vault:get',
  LOCAL_VAULT_SELECT: 'repository:local-vault:select',
  LOCAL_VAULT_DETACH: 'repository:local-vault:detach',
  LOCAL_VAULT_SCAN: 'repository:local-vault:scan',
  LOCAL_VAULT_NOTE_READ: 'repository:local-vault:note:read',
  LOCAL_VAULT_SEARCH: 'repository:local-vault:search',
  LOCAL_VAULT_OPEN_OBSIDIAN: 'repository:local-vault:open-obsidian',
  LOCAL_VAULT_NOTE_WRITE_CONFIRMED: 'repository:local-vault:note:write-confirmed',
} as const;

const channels = Object.values(Ch);

export interface RepositoryElectronModuleOptions {
  localVaultPort?: LocalVaultElectronPort;
  knowledgeRepositoryConnectionPort?: KnowledgeRepositoryConnectionElectronPort;
  knowledgeRepositoryReconciliationPort?: KnowledgeRepositoryReconciliationElectronPort;
  knowledgeRepositorySyncPort?: KnowledgeRepositorySyncElectronPort;
  knowledgeRepositoryAutoSyncScheduler?: KnowledgeRepositoryAutoSyncSchedulerElectronPort;
}

export type KnowledgeRepositoryConnectionElectronPort = Pick<
  IRepositoryApiClient,
  | 'startKnowledgeRepositoryInstallation'
  | 'completeKnowledgeRepositoryInstallation'
  | 'listKnowledgeRepositoryConnections'
  | 'connectKnowledgeRepository'
  | 'disconnectKnowledgeRepository'
  | 'issueDesktopKnowledgeRepositoryToken'
> & {
  previewKnowledgeRepositoryReconciliation(
    connectionId: string,
    localState: KnowledgeRepositoryContentState,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>>;
};

export interface KnowledgeRepositoryReconciliationElectronPort {
  execute(
    identityId: string,
    input: unknown,
  ): Promise<Result<ExecuteKnowledgeRepositoryReconciliationRes>>;
}

export interface KnowledgeRepositorySyncElectronPort {
  execute(identityId: string, input: unknown): Promise<Result<SyncKnowledgeRepositoryRes>>;
}

export interface KnowledgeRepositoryAutoSyncSchedulerElectronPort {
  start(identityId: string): Promise<void>;
  refresh(identityId: string): Promise<void>;
  stop(options?: { commitPendingChanges?: boolean }): Promise<void>;
}

async function invokeLocalVault<T>(operation: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await operation());
  } catch (error) {
    if (error instanceof LocalVaultRuntimeError) {
      return fail({ code: error.code, message: error.message });
    }
    logger.error('Local Vault operation failed', { error });
    return fail({ code: 'INTERNAL_ERROR', message: 'Local Vault operation failed' });
  }
}

export function createRepositoryElectronModule(
  options: RepositoryElectronModuleOptions = {},
): IElectronModule {
  return {
    name: 'Repository',

    async register(ctx: IElectronModuleContext): Promise<void> {
      const knowledgeConnectionPort = options.knowledgeRepositoryConnectionPort;
      const autoSyncScheduler = options.knowledgeRepositoryAutoSyncScheduler;
      const refreshAutomaticSynchronization = async (identityId: string): Promise<void> => {
        if (!autoSyncScheduler) return;
        try {
          await autoSyncScheduler.refresh(identityId);
        } catch (error) {
          logger.warn('Failed to refresh automatic knowledge repository synchronization', {
            error,
          });
        }
      };
      const withKnowledgeConnection = <T>(
        operation: (port: KnowledgeRepositoryConnectionElectronPort) => Promise<Result<T>>,
      ): Promise<Result<T>> => {
        if (!knowledgeConnectionPort) {
          return Promise.resolve(
            fail({
              code: 'SERVICE_UNAVAILABLE',
              message: 'GitHub knowledge repository connections require an online account',
            }),
          );
        }
        return operation(knowledgeConnectionPort);
      };

      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_INSTALLATION_START, (_, request) =>
        withAuthenticatedValue(ctx, () =>
          withKnowledgeConnection((port) =>
            port.startKnowledgeRepositoryInstallation(request ?? {}),
          ),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_INSTALLATION_COMPLETE, (_, request) =>
        withAuthenticatedValue(ctx, () =>
          withKnowledgeConnection((port) => port.completeKnowledgeRepositoryInstallation(request)),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_LIST, (_) =>
        withAuthenticatedValue(ctx, () =>
          withKnowledgeConnection((port) => port.listKnowledgeRepositoryConnections()),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_CONNECT, (_, request) =>
        withAuthenticatedValue(ctx, async ({ identityId }) => {
          const result = await withKnowledgeConnection((port) =>
            port.connectKnowledgeRepository(request),
          );
          if (result.ok) await refreshAutomaticSynchronization(identityId);
          return result;
        }),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_DISCONNECT, (_, request) =>
        withAuthenticatedValue(ctx, async ({ identityId }) => {
          const result = await withKnowledgeConnection((port) =>
            port.disconnectKnowledgeRepository(request.connectionId, request.purgeCloudData),
          );
          if (result.ok) await refreshAutomaticSynchronization(identityId);
          return result;
        }),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_RECONCILIATION_PREVIEW, (_, request) =>
        withAuthenticatedValue(ctx, async ({ identityId }) => {
          if (!options.localVaultPort) {
            return fail({
              code: 'SERVICE_UNAVAILABLE',
              message: 'Local Vault is only available in the Desktop runtime',
            });
          }
          const localState = await invokeLocalVault(() =>
            options.localVaultPort!.inspectSyncContent(identityId),
          );
          if (!localState.ok) return localState;
          return withKnowledgeConnection((port) =>
            port.previewKnowledgeRepositoryReconciliation(request.connectionId, localState.data),
          );
        }),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_RECONCILIATION_EXECUTE, (_, request) =>
        withAuthenticatedValue(ctx, async ({ identityId }) => {
          if (!options.knowledgeRepositoryReconciliationPort) {
            return fail({
              code: 'SERVICE_UNAVAILABLE',
              message: 'Knowledge repository Git runtime is unavailable',
            });
          }
          const result = await options.knowledgeRepositoryReconciliationPort.execute(
            identityId,
            request,
          );
          if (result.ok) await refreshAutomaticSynchronization(identityId);
          return result;
        }),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_SYNC, (_, request) =>
        withAuthenticatedValue(ctx, async ({ identityId }) => {
          if (!options.knowledgeRepositorySyncPort) {
            return fail({
              code: 'SERVICE_UNAVAILABLE',
              message: 'Knowledge repository sync runtime is unavailable',
            });
          }
          const result = await options.knowledgeRepositorySyncPort.execute(identityId, request);
          if (result.ok) await refreshAutomaticSynchronization(identityId);
          return result;
        }),
      );
      ipcMain.handle(Ch.KNOWLEDGE_CONNECTION_DESKTOP_TOKEN, (_, request) =>
        withAuthenticatedValue(ctx, () =>
          withKnowledgeConnection((port) =>
            port.issueDesktopKnowledgeRepositoryToken(request.connectionId),
          ),
        ),
      );

      const localVault = options.localVaultPort;
      const withLocalVault = async <T>(
        identityId: string,
        operation: (port: LocalVaultElectronPort, identityId: string) => Promise<T>,
      ): Promise<Result<T>> => {
        if (!localVault) {
          return fail({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Local Vault is only available in the Desktop runtime',
          });
        }
        return invokeLocalVault(() => operation(localVault, identityId));
      };

      ipcMain.handle(Ch.LOCAL_VAULT_GET, (_) =>
        withAuthenticatedValue(ctx, ({ identityId }) =>
          withLocalVault(identityId, (port, ownerId) => port.getBinding(ownerId)),
        ),
      );
      ipcMain.handle(Ch.LOCAL_VAULT_SELECT, (_, request) =>
        withAuthenticatedValue(ctx, async ({ identityId }) => {
          const result = await withLocalVault(identityId, (port, ownerId) =>
            port.selectVault(ownerId, request),
          );
          if (result.ok) await refreshAutomaticSynchronization(identityId);
          return result;
        }),
      );
      ipcMain.handle(Ch.LOCAL_VAULT_DETACH, (_) =>
        withAuthenticatedValue(ctx, async ({ identityId }) => {
          const result = await withLocalVault(identityId, (port, ownerId) =>
            port.detachVault(ownerId),
          );
          if (result.ok) await refreshAutomaticSynchronization(identityId);
          return result;
        }),
      );
      ipcMain.handle(Ch.LOCAL_VAULT_SCAN, (_) =>
        withAuthenticatedValue(ctx, ({ identityId }) =>
          withLocalVault(identityId, (port, ownerId) => port.scanVault(ownerId)),
        ),
      );
      ipcMain.handle(Ch.LOCAL_VAULT_NOTE_READ, (_, request) =>
        withAuthenticatedValue(ctx, ({ identityId }) =>
          withLocalVault(identityId, (port, ownerId) => port.readNote(ownerId, request)),
        ),
      );
      ipcMain.handle(Ch.LOCAL_VAULT_SEARCH, (_, request) =>
        withAuthenticatedValue(ctx, ({ identityId }) =>
          withLocalVault(identityId, (port, ownerId) => port.searchVault(ownerId, request)),
        ),
      );
      ipcMain.handle(Ch.LOCAL_VAULT_OPEN_OBSIDIAN, (_, request) =>
        withAuthenticatedValue(ctx, ({ identityId }) =>
          withLocalVault(identityId, (port, ownerId) => port.openInObsidian(ownerId, request)),
        ),
      );
      ipcMain.handle(Ch.LOCAL_VAULT_NOTE_WRITE_CONFIRMED, (_, request) =>
        withAuthenticatedValue(ctx, ({ identityId }) =>
          withLocalVault(identityId, (port, ownerId) => port.writeConfirmedNote(ownerId, request)),
        ),
      );

      if (autoSyncScheduler) {
        try {
          const identityId = await ctx.auth.getIdentityId();
          if (identityId) await autoSyncScheduler.start(identityId);
        } catch (error) {
          logger.warn('Failed to start automatic knowledge repository synchronization', {
            error,
          });
        }
      }

      logger.info('Repository module registered');
    },

    async destroy(): Promise<void> {
      if (options.knowledgeRepositoryAutoSyncScheduler) {
        try {
          await options.knowledgeRepositoryAutoSyncScheduler.stop({
            commitPendingChanges: true,
          });
        } catch (error) {
          logger.warn('Failed to stop automatic knowledge repository synchronization', {
            error,
          });
        }
      }
      for (const ch of channels) {
        ipcMain.removeHandler(ch);
      }
      logger.info('Repository module destroyed');
    },
  };
}

export const RepositoryElectronModule: IElectronModule = createRepositoryElectronModule();
