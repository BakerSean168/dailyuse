import path from 'node:path';
import type { Alias } from 'vite';

function toPosixPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function resolveFromWorkspace(workspaceRoot: string, relativePath: string): string {
  return toPosixPath(path.resolve(workspaceRoot, relativePath));
}

export function createWorkspaceSourceAliasEntries(
  workspaceRoot: string,
  entries: ReadonlyArray<readonly [string, string]>,
): Alias[] {
  return entries.map(([find, relativePath]) => ({
    find,
    replacement: resolveFromWorkspace(workspaceRoot, relativePath),
  }));
}

export function createContractsAliasEntries(workspaceRoot: string): Alias[] {
  const contractsRoot = resolveFromWorkspace(workspaceRoot, 'packages/contracts/src');

  return [
    {
      find: /^@dailyuse\/contracts\/primitives$/,
      replacement: `${contractsRoot}/primitives/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts\/shared$/,
      replacement: `${contractsRoot}/shared/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts\/result$/,
      replacement: `${contractsRoot}/result/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts\/electron$/,
      replacement: `${contractsRoot}/electron/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts\/dashboard$/,
      replacement: `${contractsRoot}/dashboard/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts\/mocks$/,
      replacement: `${contractsRoot}/mocks/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts\/modules\/(.+)$/,
      replacement: `${contractsRoot}/modules/$1/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts\/(.+)$/,
      replacement: `${contractsRoot}/modules/$1/index.ts`,
    },
    {
      find: /^@dailyuse\/contracts$/,
      replacement: `${contractsRoot}/index.ts`,
    },
  ];
}

export function createUiVueSourceAliasEntries(workspaceRoot: string): Alias[] {
  const uiVueRoot = resolveFromWorkspace(workspaceRoot, 'packages/ui-vue-shadcn/src');
  const uiCoreRoot = resolveFromWorkspace(workspaceRoot, 'packages/ui-core/src');

  return [
    {
      find: /^@dailyuse\/ui-vue-shadcn$/,
      replacement: `${uiVueRoot}/index.ts`,
    },
    {
      find: /^@dailyuse\/ui-core$/,
      replacement: `${uiCoreRoot}/index.ts`,
    },
    {
      find: /^@\/components\/ui\/(.+)$/,
      replacement: `${uiVueRoot}/components/ui/$1`,
    },
    {
      find: /^@\/lib\/(.+)$/,
      replacement: `${uiVueRoot}/lib/$1`,
    },
  ];
}
