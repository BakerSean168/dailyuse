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

export function createAppVueSourceAliasEntries(workspaceRoot: string): Alias[] {
  const appVueRoot = resolveFromWorkspace(workspaceRoot, 'packages/app-vue/src');

  return [
    {
      find: /^@dailyuse\/app-vue\/web-overlays$/,
      replacement: `${appVueRoot}/web-overlays.ts`,
    },
    {
      find: /^@dailyuse\/app-vue\/di$/,
      replacement: `${appVueRoot}/di/index.ts`,
    },
    {
      find: /^@dailyuse\/app-vue\/desktop$/,
      replacement: `${appVueRoot}/desktop.ts`,
    },
    {
      find: /^@dailyuse\/app-vue\/plugins\/i18n$/,
      replacement: `${appVueRoot}/plugins/i18n.ts`,
    },
    {
      find: /^@dailyuse\/app-vue\/router$/,
      replacement: `${appVueRoot}/router/index.ts`,
    },
    {
      find: /^@dailyuse\/app-vue\/modules\/dashboard\/adapters$/,
      replacement: `${appVueRoot}/modules/dashboard/adapters/index.ts`,
    },
    {
      find: /^@dailyuse\/app-vue\/modules\/(.+)$/,
      replacement: `${appVueRoot}/modules/$1/index.ts`,
    },
    {
      find: /^@dailyuse\/app-vue$/,
      replacement: `${appVueRoot}/index.ts`,
    },
  ];
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
      find: /^@dailyuse\/ui-vue-shadcn\/(.+)$/,
      replacement: `${uiVueRoot}/$1`,
    },
    {
      find: /^@dailyuse\/ui-vue-shadcn$/,
      replacement: `${uiVueRoot}/index.ts`,
    },
    {
      find: /^@dailyuse\/ui-core\/(.+)$/,
      replacement: `${uiCoreRoot}/$1`,
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

export function createAssetsAliasEntries(workspaceRoot: string): Alias[] {
  const assetsRoot = resolveFromWorkspace(workspaceRoot, 'packages/assets/src');

  return [
    {
      find: /^@dailyuse\/assets\/audio$/,
      replacement: `${assetsRoot}/audio/index.ts`,
    },
    {
      find: /^@dailyuse\/assets\/images$/,
      replacement: `${assetsRoot}/images/index.ts`,
    },
    {
      find: /^@dailyuse\/assets$/,
      replacement: `${assetsRoot}/index.ts`,
    },
  ];
}
