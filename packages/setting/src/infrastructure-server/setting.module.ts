import type { IUserSettingRepository } from '../domain-server/repositories/IUserSettingRepository';

import {
  GetUserSetting,
  PatchUserSetting,
  ResetUserSetting,
  ExportSettings,
  ImportSettings,
  GetDefaultSettings,
} from '../application-server';
/** Setting runtime side effects. Setting 模块拥有的运行时副作用。 */
export interface SettingModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

export type SettingRuntimeContributionsInput =
  | SettingModuleRuntimeContribution
  | readonly SettingModuleRuntimeContribution[];

/** Explicit dependencies for the setting server runtime. Setting 服务端运行时的显式依赖。 */
export interface SettingModuleDependencies {
  readonly userSettingRepository: IUserSettingRepository;
  readonly runtimeContributions?: SettingRuntimeContributionsInput;
}

/** Lower-level use case graph kept for tests and diagnostics. */
export interface SettingModuleUseCases {
  readonly getUserSetting: GetUserSetting;
  readonly patchUserSetting: PatchUserSetting;
  readonly resetUserSetting: ResetUserSetting;
  readonly exportSettings: ExportSettings;
  readonly importSettings: ImportSettings;
  readonly getDefaultSettings: GetDefaultSettings;
}

/** Transport-neutral application surface. 传输层无关的应用层门面。 */
export interface SettingApplicationPort {
  getUserSetting(identityId: string): Promise<Awaited<ReturnType<GetUserSetting['execute']>>>;
  patchUserSetting(
    identityId: string,
    category: Parameters<PatchUserSetting['execute']>[1],
    patch: Parameters<PatchUserSetting['execute']>[2],
  ): Promise<Awaited<ReturnType<PatchUserSetting['execute']>>>;
  resetUserSetting(
    identityId: string,
    category?: Parameters<ResetUserSetting['execute']>[1],
  ): Promise<Awaited<ReturnType<ResetUserSetting['execute']>>>;
  exportSettings(identityId: string): Promise<Awaited<ReturnType<ExportSettings['execute']>>>;
  importSettings(
    identityId: string,
    data: Parameters<ImportSettings['execute']>[1],
    options?: Parameters<ImportSettings['execute']>[2],
  ): Promise<Awaited<ReturnType<ImportSettings['execute']>>>;
  getDefaultSettings(): ReturnType<GetDefaultSettings['execute']>;
}

export interface SettingModuleInstance {
  readonly userSettingRepository: IUserSettingRepository;
  readonly useCases: SettingModuleUseCases;
  readonly api: SettingApplicationPort;
  start(): void;
  dispose(): void;
}

export function createSettingUseCases(
  dependencies: SettingModuleDependencies,
): SettingModuleUseCases {
  const { userSettingRepository } = dependencies;

  return {
    getUserSetting: new GetUserSetting(userSettingRepository),
    patchUserSetting: new PatchUserSetting(userSettingRepository),
    resetUserSetting: new ResetUserSetting(userSettingRepository),
    exportSettings: new ExportSettings(userSettingRepository),
    importSettings: new ImportSettings(userSettingRepository),
    getDefaultSettings: new GetDefaultSettings(),
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?: SettingRuntimeContributionsInput,
): readonly SettingModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  return Array.isArray(runtimeContributions)
    ? Array.from(runtimeContributions)
    : [runtimeContributions as SettingModuleRuntimeContribution];
}

/**
 * Canonical setting composition root.
 * 规范化的 setting 模块组合根。
 */
export function createSettingModule(
  dependencies: SettingModuleDependencies,
): SettingModuleInstance {
  const { userSettingRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createSettingUseCases({ userSettingRepository });
  let started = false;

  return {
    userSettingRepository,
    useCases,
    api: {
      getUserSetting: (identityId) => useCases.getUserSetting.execute(identityId),
      patchUserSetting: (identityId, category, patch) =>
        useCases.patchUserSetting.execute(identityId, category, patch),
      resetUserSetting: (identityId, category) =>
        useCases.resetUserSetting.execute(identityId, category),
      exportSettings: (identityId) => useCases.exportSettings.execute(identityId),
      importSettings: (identityId, data, options) =>
        useCases.importSettings.execute(identityId, data, options),
      getDefaultSettings: () => useCases.getDefaultSettings.execute(),
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
