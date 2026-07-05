import path from 'node:path';

export const domainResolveAtAlias = {
  name: 'domain-resolve-at-alias',
  async resolveId(
    this: {
      resolve: (id: string, importer: string, opts: Record<string, unknown>) => Promise<unknown>;
    },
    source: string,
    importer: string | undefined,
    options: Record<string, unknown>,
  ) {
    if (!source.startsWith('@/') || !importer) return null;
    const subpath = source.slice(2);
    const packagesDir = path.resolve(__dirname, 'packages');

    const domainPackages = [
      'contracts',
      'task',
      'setting',
      'goal',
      'governance',
      'reminder',
      'ai',
      'authentication',
      'account',
      'notification',
      'editor',
      'repository',
      'schedule',
      'schedule-orchestration',
    ];

    let root: string | null = null;
    for (const pkg of domainPackages) {
      if (importer.startsWith(path.resolve(packagesDir, pkg) + '/')) {
        root = path.resolve(packagesDir, pkg, 'src');
        break;
      }
    }

    if (!root) return null;

    const resolved = path.resolve(root, subpath);
    return this.resolve(resolved, importer, {
      ...options,
      skipSelf: true,
    });
  },
};

export const taskDeepImportResolver = {
  name: 'task-deep-import-resolver',
  enforce: 'pre' as const,
  async resolveId(
    this: {
      resolve: (id: string, importer: string, opts: Record<string, unknown>) => Promise<unknown>;
    },
    source: string,
    importer: string | undefined,
    options: Record<string, unknown>,
  ) {
    const match = source.match(/^@dailyuse\/task\/(.+)/);
    if (!match || !importer) return null;
    const subpath = match[1];
    const taskSrc = path.resolve(__dirname, 'packages/task/src');

    const directFile = path.resolve(taskSrc, `${subpath}.ts`);
    const directResult = await this.resolve(directFile, importer, {
      ...options,
      skipSelf: true,
    });
    if (directResult) return directResult;

    const indexFile = path.resolve(taskSrc, subpath, 'index.ts');
    const indexResult = await this.resolve(indexFile, importer, {
      ...options,
      skipSelf: true,
    });
    if (indexResult) return indexResult;

    return null;
  },
};

export const contractsDeepImportResolver = {
  name: 'contracts-deep-import-resolver',
  enforce: 'pre' as const,
  async resolveId(
    this: {
      resolve: (id: string, importer: string, opts: Record<string, unknown>) => Promise<unknown>;
    },
    source: string,
    importer: string | undefined,
    options: Record<string, unknown>,
  ) {
    const match = source.match(/^@dailyuse\/contracts\/(.+)/);
    if (!match || !importer) return null;
    const subpath = match[1];
    const contractsSrc = path.resolve(__dirname, 'packages/contracts/src');

    const modulesIndex = path.resolve(contractsSrc, 'modules', subpath, 'index.ts');
    const modulesResult = await this.resolve(modulesIndex, importer, {
      ...options,
      skipSelf: true,
    });
    if (modulesResult) return modulesResult;

    const topLevelIndex = path.resolve(contractsSrc, subpath, 'index.ts');
    const topLevelResult = await this.resolve(topLevelIndex, importer, {
      ...options,
      skipSelf: true,
    });
    if (topLevelResult) return topLevelResult;

    const directFile = path.resolve(contractsSrc, `${subpath}.ts`);
    const directResult = await this.resolve(directFile, importer, {
      ...options,
      skipSelf: true,
    });
    if (directResult) return directResult;

    return null;
  },
};

const contractsSrc = path.resolve(__dirname, './packages/contracts/src');

export const domainResolveAliases = [
  {
    find: '@dailyuse/database/prisma',
    replacement: path.resolve(__dirname, './packages/database/src/generated/prisma/client.js'),
  },
  {
    find: '@dailyuse/powersync-schema',
    replacement: path.resolve(__dirname, './packages/powersync-schema/src/index.ts'),
  },
  {
    find: '@dailyuse/database',
    replacement: path.resolve(__dirname, './packages/database/src/index.ts'),
  },
  {
    find: /^@dailyuse\/domain-shared\/(.+)/,
    replacement: path.resolve(__dirname, './packages/domain-shared/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/domain-shared',
    replacement: path.resolve(__dirname, './packages/domain-shared/src/index.ts'),
  },
  {
    find: /^@dailyuse\/utils\/(.+)/,
    replacement: path.resolve(__dirname, './packages/utils/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/utils',
    replacement: path.resolve(__dirname, './packages/utils/src/index.ts'),
  },
  {
    find: '@dailyuse/patterns',
    replacement: path.resolve(__dirname, './packages/patterns/src/index.ts'),
  },
  {
    find: /^@dailyuse\/test-utils\/(.+)/,
    replacement: path.resolve(__dirname, './packages/test-utils/src/$1'),
  },
  {
    find: '@dailyuse/test-utils',
    replacement: path.resolve(__dirname, './packages/test-utils/src/index.ts'),
  },
  {
    find: '@dailyuse/contracts/result',
    replacement: path.resolve(contractsSrc, 'result/index.ts'),
  },
  {
    find: '@dailyuse/contracts/shared',
    replacement: path.resolve(contractsSrc, 'shared/index.ts'),
  },
  {
    find: '@dailyuse/contracts/primitives',
    replacement: path.resolve(contractsSrc, 'primitives/index.ts'),
  },
  {
    find: '@dailyuse/contracts/electron',
    replacement: path.resolve(contractsSrc, 'electron/index.ts'),
  },
  {
    find: '@dailyuse/contracts/mocks',
    replacement: path.resolve(contractsSrc, 'mocks/index.ts'),
  },
  {
    find: /^@dailyuse\/contracts\/modules\/(.+)/,
    replacement: path.resolve(contractsSrc, 'modules/$1/index.ts'),
  },
  {
    find: /^@dailyuse\/contracts\/(.+)/,
    replacement: path.resolve(contractsSrc, 'modules/$1/index.ts'),
  },
  {
    find: '@dailyuse/contracts',
    replacement: path.resolve(contractsSrc, 'index.ts'),
  },
  {
    find: /^@dailyuse\/task\/(.+)/,
    replacement: path.resolve(__dirname, './packages/task/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/task',
    replacement: path.resolve(__dirname, './packages/task/src/index.ts'),
  },
  {
    find: /^@dailyuse\/schedule-orchestration\/(.+)/,
    replacement: path.resolve(__dirname, './packages/schedule-orchestration/src/$1'),
  },
  {
    find: '@dailyuse/schedule-orchestration',
    replacement: path.resolve(__dirname, './packages/schedule-orchestration/src/index.ts'),
  },
  {
    find: /^@dailyuse\/authentication\/(.+)/,
    replacement: path.resolve(__dirname, './packages/authentication/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/authentication',
    replacement: path.resolve(__dirname, './packages/authentication/src/index.ts'),
  },
];

export const taskResolveAliases = [
  {
    find: /^@\/(.+)/,
    replacement: path.resolve(__dirname, './packages/task/src/$1'),
  },
  ...domainResolveAliases,
];

export function createPackageResolveAliases(
  packageName: string,
  extraAliases: Array<{ find: string | RegExp; replacement: string }> = [],
) {
  return [
    {
      find: /^@\/(.+)/,
      replacement: path.resolve(__dirname, `./packages/${packageName}/src/$1`),
    },
    ...extraAliases,
    ...domainResolveAliases,
  ];
}
