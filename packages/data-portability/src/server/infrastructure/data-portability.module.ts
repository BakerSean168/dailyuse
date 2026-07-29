import type {
  ExportUserDataReq,
  ImportUserDataReq,
} from '@memoflow/contracts/data-portability';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type { DataPortabilityApplicationPort } from '../application';
import type { DataPortabilityDependencies } from '../application/data-portability.dependencies';
import type { DataPortabilityImportStore } from '../application/import-store/data-portability-import-store';
import { ExportUserDataUseCase } from '../application/use-cases/export-user-data.use-case';
import { ImportUserDataUseCase } from '../application/use-cases/import-user-data.use-case';
import { createPowerSyncDataPortabilityDependencies } from './powersync/powersync-export-dependencies';
import { PowerSyncDataPortabilityImportStore } from './powersync/powersync-import-store';

export interface DataPortabilityModuleDependencies {
  readonly exportDependencies: DataPortabilityDependencies;
  readonly importStore: DataPortabilityImportStore;
  readonly runtimeContributions?:
    | DataPortabilityModuleRuntimeContribution
    | readonly DataPortabilityModuleRuntimeContribution[];
}

export interface DataPortabilityModuleUseCases {
  readonly exportUserData: ExportUserDataUseCase;
  readonly importUserData: ImportUserDataUseCase;
}

export interface DataPortabilityModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

export interface DataPortabilityModuleInstance {
  readonly exportDependencies: DataPortabilityDependencies;
  readonly importStore: DataPortabilityImportStore;
  readonly useCases: DataPortabilityModuleUseCases;
  readonly api: DataPortabilityApplicationPort;
  start(): void;
  dispose(): void;
}

export function createDataPortabilityUseCases(
  dependencies: DataPortabilityModuleDependencies,
): DataPortabilityModuleUseCases {
  return {
    exportUserData: new ExportUserDataUseCase(dependencies.exportDependencies),
    importUserData: new ImportUserDataUseCase(dependencies.importStore),
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?:
    | DataPortabilityModuleRuntimeContribution
    | readonly DataPortabilityModuleRuntimeContribution[],
): readonly DataPortabilityModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  return Array.isArray(runtimeContributions)
    ? Array.from(runtimeContributions)
    : [runtimeContributions as DataPortabilityModuleRuntimeContribution];
}

/**
 * Canonical data portability composition root.
 * 规范化的 data portability 模块组合根。
 */
export function createDataPortabilityModule(
  dependencies: DataPortabilityModuleDependencies,
): DataPortabilityModuleInstance {
  const useCases = createDataPortabilityUseCases(dependencies);
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  let started = false;

  return {
    exportDependencies: dependencies.exportDependencies,
    importStore: dependencies.importStore,
    useCases,
    api: {
      exportUserData: (identityId, request) =>
        useCases.exportUserData.execute(identityId, request.include),
      importUserData: (identityId, request) =>
        useCases.importUserData.execute(identityId, request.content, request.dryRun ?? false),
    },
    start(): void {
      if (started) return;
      for (const runtime of runtimeContributions) {
        runtime.start();
      }
      started = true;
    },
    dispose(): void {
      if (!started) return;
      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }
      started = false;
    },
  };
}

export function createPowerSyncDataPortabilityModule(
  db: IElectronDatabase,
  options: {
    readonly runtimeContributions?:
      | DataPortabilityModuleRuntimeContribution
      | readonly DataPortabilityModuleRuntimeContribution[];
  } = {},
): DataPortabilityModuleInstance {
  return createDataPortabilityModule({
    exportDependencies: createPowerSyncDataPortabilityDependencies(db),
    importStore: new PowerSyncDataPortabilityImportStore(db),
    runtimeContributions: options.runtimeContributions,
  });
}
