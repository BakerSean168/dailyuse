import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

function readWorkspaceFile(relativePath: string) {
  return readFileSync(resolve(workspaceRoot, relativePath), 'utf8');
}

function expectChannelsInSource(source: string, channels: Record<string, string>) {
  for (const channel of Object.values(channels)) {
    expect(source.includes(channel), `missing channel ${channel}`).toBe(true);
  }
}

function expectChannelRefsInSource(
  source: string,
  channelNamespace: string,
  channels: Record<string, string>,
) {
  for (const channelName of Object.keys(channels)) {
    expect(
      source.includes(`${channelNamespace}.${channelName}`),
      `missing channel reference ${channelNamespace}.${channelName}`,
    ).toBe(true);
  }
}

describe('desktop main handler contracts', () => {
  it('auth main module covers all shared auth channels', () => {
    const source = readWorkspaceFile(
      'apps/desktop/src/main/modules/authentication/desktop-auth-shell.ts',
    );
    expectChannelsInSource(source, AuthChannels);
  });

  it('account electron entry covers all shared account channels', () => {
    const source = readWorkspaceFile('packages/account/src/electron-entry/index.ts');
    expectChannelsInSource(source, AccountChannels);
  });

  it('ai electron entry covers all shared ai channels', () => {
    const source = readWorkspaceFile('packages/ai/src/electron-entry/index.ts');
    expectChannelsInSource(source, AIChannels);
  });

  it('governance electron seam covers all shared governance channels', () => {
    const source = readWorkspaceFile('packages/governance/src/electron/index.ts');
    expectChannelRefsInSource(source, 'GovernanceChannels', GovernanceChannels);
  });

  it('goal electron entry covers all shared goal channels', () => {
    const source = readWorkspaceFile('packages/goal/src/electron-entry/index.ts');
    expectChannelsInSource(source, GoalChannels);
  });

  it('task electron entry covers all shared task channels', () => {
    const source = readWorkspaceFile('packages/task/src/electron-entry/index.ts');
    expectChannelsInSource(source, TaskChannels);
  });

  it('schedule electron entry covers all shared schedule channels', () => {
    const source = readWorkspaceFile('packages/schedule/src/electron-entry/index.ts');
    expectChannelsInSource(source, ScheduleChannels);
  });

  it('reminder electron entry covers all shared reminder channels', () => {
    const source = readWorkspaceFile('packages/reminder/src/electron-entry/index.ts');
    expectChannelsInSource(source, ReminderChannels);
  });

  it('repository electron entry covers all shared repository channels', () => {
    const source = readWorkspaceFile('packages/repository/src/electron-entry/index.ts');
    expectChannelsInSource(source, RepositoryChannels);
  });

  it('notification electron entry covers all shared notification channels', () => {
    const source = readWorkspaceFile('packages/notification/src/electron-entry/index.ts');
    expectChannelsInSource(source, NotificationChannels);
  });

  it('setting electron entry covers all shared setting channels', () => {
    const source = readWorkspaceFile('packages/setting/src/electron-entry/index.ts');
    expectChannelsInSource(source, SettingChannels);
  });

  it('data-portability electron entry covers all shared data-portability channels', () => {
    const source = readWorkspaceFile('packages/data-portability/src/electron-entry/index.ts');
    expectChannelsInSource(source, DataPortabilityChannels);
  });
});