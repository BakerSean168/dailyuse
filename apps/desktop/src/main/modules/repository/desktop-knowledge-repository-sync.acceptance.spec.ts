import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { KnowledgeRepositoryConnectionClientDTO } from '@dailyuse/contracts/repository';
import { ok } from '@dailyuse/contracts/result';
import {
  DesktopKnowledgeRepositoryGitRuntime,
  NodeGitProcessPort,
  type GitProcessPort,
  type GitProcessResult,
  type GitProcessRunOptions,
} from './desktop-knowledge-repository-git.runtime';
import { DesktopKnowledgeRepositorySyncService } from './desktop-knowledge-repository-sync.service';

const IDENTITY_ID = 'identity-1';
const REPOSITORY_ID = '987654321';
const REPOSITORY_FULL_NAME = 'owner/knowledge';
const TOKEN = 'short-lived-repository-token';
const NOW = 1_750_000_000_000;
const PUBLIC_REMOTE_URL = 'https://github.com/owner/knowledge.git';

const realGit = new NodeGitProcessPort();
const temporaryDirectories: string[] = [];

class LocalRemoteGitProcessPort implements GitProcessPort {
  constructor(private readonly remotePath: string) {}

  async run(
    args: readonly string[],
    options: GitProcessRunOptions = {},
  ): Promise<GitProcessResult> {
    const mappedArgs = [...args];
    if (
      mappedArgs[0] === 'remote' &&
      (mappedArgs[1] === 'add' || mappedArgs[1] === 'set-url') &&
      mappedArgs.at(-1)?.startsWith('https://github.com/')
    ) {
      mappedArgs[mappedArgs.length - 1] = this.remotePath;
    }
    const result = await realGit.run(mappedArgs, options);
    if (
      args[0] === 'remote' &&
      args[1] === 'get-url' &&
      args[2] === 'origin' &&
      result.exitCode === 0
    ) {
      return { ...result, stdout: `${PUBLIC_REMOTE_URL}\n` };
    }
    return result;
  }
}

function connection(
  overrides: Partial<KnowledgeRepositoryConnectionClientDTO> = {},
): KnowledgeRepositoryConnectionClientDTO {
  return {
    id: 'connection-1',
    identityId:
      'IdentityId_11111111-1111-4111-8111-111111111111' as KnowledgeRepositoryConnectionClientDTO['identityId'],
    githubUserId: '42',
    githubRepositoryId: REPOSITORY_ID,
    githubRepositoryFullName: REPOSITORY_FULL_NAME,
    installationId: 'installation-1',
    defaultBranch: 'main',
    status: 'Active',
    lastSyncedCommitSha: null,
    lastErrorCode: null,
    canSync: true,
    createdAt: NOW as KnowledgeRepositoryConnectionClientDTO['createdAt'],
    updatedAt: NOW as KnowledgeRepositoryConnectionClientDTO['updatedAt'],
    ...overrides,
  };
}

async function temporaryDirectory(label: string): Promise<string> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), `memoflow-${label}-`));
  temporaryDirectories.push(directory);
  return directory;
}

async function createBareRemote(): Promise<string> {
  const remote = await temporaryDirectory('sync-acceptance-remote');
  await realGit.run(['init', '--bare', '--initial-branch', 'main'], { cwd: remote });
  return remote;
}

async function cloneRemoteWorktree(remote: string): Promise<string> {
  const parent = await temporaryDirectory('sync-acceptance-worktree');
  const worktree = path.join(parent, 'worktree');
  await realGit.run(['clone', '--branch', 'main', remote, worktree]);
  await realGit.run(['config', '--local', 'user.name', 'Memoflow Test'], { cwd: worktree });
  await realGit.run(['config', '--local', 'user.email', 'test@memoflow.local'], {
    cwd: worktree,
  });
  return worktree;
}

async function commitAndPush(
  worktree: string,
  relativePath: string,
  content: string,
): Promise<string> {
  const filePath = path.join(worktree, relativePath);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, content, 'utf8');
  await realGit.run(['add', '-A'], { cwd: worktree });
  await realGit.run(['commit', '-m', 'web note'], { cwd: worktree });
  await realGit.run(['push', 'origin', 'main'], { cwd: worktree });
  return (await realGit.run(['rev-parse', 'HEAD'], { cwd: worktree })).stdout.trim();
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => fs.promises.rm(directory, { recursive: true, force: true })),
  );
});

describe('DesktopKnowledgeRepositorySyncService acceptance', () => {
  it('pulls a remote commit into the bound Vault and confirms the new HEAD', async () => {
    const remotePath = await createBareRemote();
    const vaultPath = await temporaryDirectory('sync-acceptance-vault');
    await fs.promises.writeFile(path.join(vaultPath, 'local.md'), 'local note\n', 'utf8');

    const gitRuntime = new DesktopKnowledgeRepositoryGitRuntime(
      new LocalRemoteGitProcessPort(remotePath),
    );
    const initialized = await gitRuntime.reconcile({
      rootPath: vaultPath,
      repositoryId: REPOSITORY_ID,
      repositoryFullName: REPOSITORY_FULL_NAME,
      defaultBranch: 'main',
      expectedRemoteHeadSha: null,
      action: 'InitializeRemoteFromLocal',
      token: TOKEN,
    });
    const remoteWorktree = await cloneRemoteWorktree(remotePath);
    const remoteHead = await commitAndPush(remoteWorktree, 'from-web.md', 'created on Web\n');
    const current = connection({ lastSyncedCommitSha: initialized.headSha });
    let confirmedConnection: KnowledgeRepositoryConnectionClientDTO | null = null;
    const service = new DesktopKnowledgeRepositorySyncService({
      localVault: {
        getBinding: async (identityId: string) =>
          identityId === IDENTITY_ID ? { rootPath: vaultPath, status: 'Active' as const } : null,
      },
      remote: {
        listKnowledgeRepositoryConnections: async () => ok({ connections: [current] }),
        issueDesktopKnowledgeRepositoryToken: async () =>
          ok({
            token: TOKEN,
            repositoryId: REPOSITORY_ID,
            expiresAt: NOW + 300_000,
          }),
        confirmKnowledgeRepositoryHead: async (_connectionId, request) => {
          confirmedConnection = connection({ lastSyncedCommitSha: request.headSha });
          return ok(confirmedConnection);
        },
      },
      gitRuntime,
      now: () => NOW,
    });

    await expect(service.execute(IDENTITY_ID, { connectionId: current.id })).resolves.toMatchObject(
      {
        ok: true,
        data: {
          outcome: 'Pulled',
          headSha: remoteHead,
          localCommitCreated: false,
          remoteChangesApplied: true,
          pushed: false,
          connection: { lastSyncedCommitSha: remoteHead },
        },
      },
    );
    await expect(fs.promises.readFile(path.join(vaultPath, 'from-web.md'), 'utf8')).resolves.toBe(
      'created on Web\n',
    );
    expect(confirmedConnection?.lastSyncedCommitSha).toBe(remoteHead);
  });
});
