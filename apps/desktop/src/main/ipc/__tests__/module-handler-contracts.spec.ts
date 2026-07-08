import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AIChannels,
  AuthChannels,
  DataPortabilityChannels,
  GovernanceChannels,
  NotificationChannels,
  AccountChannels,
  GoalChannels,
  ReminderChannels,
  RepositoryChannels,
  ScheduleChannels,
  SettingChannels,
  TaskChannels,
} from '../../../shared/types/ipc-channels';

const workspaceRoot = resolve(__dirname, '../../../../../..');

function resolveSourceImport(baseFilePath: string, specifier: string) {
  const resolvedPath = resolve(dirname(baseFilePath), specifier);

  if (extname(resolvedPath) === '.ts') {
    return resolvedPath;
  }

  if (existsSync(`${resolvedPath}.ts`)) {
    return `${resolvedPath}.ts`;
  }

  return resolve(resolvedPath, 'index.ts');
}

function readWorkspaceModuleSource(relativePath: string) {
  const absolutePath = resolve(workspaceRoot, relativePath);
  const source = readFileSync(absolutePath, 'utf8');
  const reExportMatch = source.match(/from ['"](\.\.\/electron-entry(?:\/index)?(?:\.ts)?)['"]/);

  if (!reExportMatch) {
    return source;
  }

  return `${source}\n${readFileSync(resolveSourceImport(absolutePath, reExportMatch[1]), 'utf8')}`;
}

function expectChannelCoverageInSource(
  source: string,
  channelNamespace: string,
  channels: Record<string, string>,
) {
  for (const [channelName, channel] of Object.entries(channels)) {
    const hasLiteral = source.includes(channel);
    const hasRef = source.includes(`${channelNamespace}.${channelName}`);
    expect(
      hasLiteral || hasRef,
      `missing channel ${channel} or channel reference ${channelNamespace}.${channelName}`,
    ).toBe(true);
  }
}

describe('desktop main handler contracts', () => {
  it('auth main module covers all shared auth channels', () => {
    const source = readWorkspaceModuleSource(
      'apps/desktop/src/main/modules/authentication/desktop-auth-shell.ts',
    );
    expectChannelCoverageInSource(source, 'AuthChannels', AuthChannels);
  });

  it('account electron seam covers all shared account channels', () => {
    const source = readWorkspaceModuleSource('packages/account/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'AccountChannels', AccountChannels);
  });

  it('ai electron entry covers all shared ai channels', () => {
    const source = readWorkspaceModuleSource('packages/ai/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'AIChannels', AIChannels);
  });

  it('governance electron seam covers all shared governance channels', () => {
    const source = readWorkspaceModuleSource('packages/governance/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'GovernanceChannels', GovernanceChannels);
  });

  it('goal electron entry covers all shared goal channels', () => {
    const source = readWorkspaceModuleSource('packages/goal/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'GoalChannels', GoalChannels);
  });

  it('task electron entry covers all shared task channels', () => {
    const source = readWorkspaceModuleSource('packages/task/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'TaskChannels', TaskChannels);
  });

  it('schedule electron entry covers all shared schedule channels', () => {
    const source = readWorkspaceModuleSource('packages/schedule/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'ScheduleChannels', ScheduleChannels);
  });

  it('reminder electron entry covers all shared reminder channels', () => {
    const source = readWorkspaceModuleSource('packages/reminder/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'ReminderChannels', ReminderChannels);
  });

  it('repository electron seam covers all shared repository channels', () => {
    const source = readWorkspaceModuleSource('packages/repository/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'RepositoryChannels', RepositoryChannels);
  });

  it('notification electron entry covers all shared notification channels', () => {
    const source = readWorkspaceModuleSource('packages/notification/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'NotificationChannels', NotificationChannels);
  });

  it('setting electron seam covers all shared setting channels', () => {
    const source = readWorkspaceModuleSource('packages/setting/src/electron/index.ts');
    expectChannelCoverageInSource(source, 'SettingChannels', SettingChannels);
  });

  it('data-portability electron entry covers all shared data-portability channels', () => {
    const source = readWorkspaceModuleSource('packages/data-portability/src/electron/index.ts');
    expectChannelCoverageInSource(
      source,
      'DataPortabilityChannels',
      DataPortabilityChannels,
    );
  });
});
