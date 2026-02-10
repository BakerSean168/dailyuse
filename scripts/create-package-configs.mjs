#!/usr/bin/env node
/**
 * Script to create package.json, tsconfig.json, tsup.config.ts, project.json, and index.ts
 * for each of the 8 extracted modules.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MODULES = [
  { name: 'goal', description: '目标模块 - OKR 目标与关键结果管理', hasAppClient: true, hasInfraClient: true },
  { name: 'task', description: '任务模块 - 任务模板、实例与依赖管理', hasAppClient: true, hasInfraClient: true },
  { name: 'repository', description: '仓库模块 - 文件/文档仓库管理', hasAppClient: true, hasInfraClient: true },
  { name: 'editor', description: '编辑器模块 - 文档编辑与协同', hasAppClient: false, hasInfraClient: false },
  { name: 'reminder', description: '提醒模块 - 提醒模板、组与调度', hasAppClient: true, hasInfraClient: true },
  { name: 'notification', description: '通知模块 - 多渠道通知管理', hasAppClient: true, hasInfraClient: true },
  { name: 'schedule', description: '调度模块 - 日程与时间管理', hasAppClient: true, hasInfraClient: true },
  { name: 'setting', description: '设置模块 - 用户与系统配置', hasAppClient: true, hasInfraClient: true },
];

for (const mod of MODULES) {
  const pkgDir = path.join(ROOT, 'packages', mod.name);

  // ============ package.json ============
  const exports = {
    '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    './domain-shared': { types: './dist/domain-shared/index.d.ts', import: './dist/domain-shared/index.js' },
    './domain-server': { types: './dist/domain-server/index.d.ts', import: './dist/domain-server/index.js' },
    './domain-client': { types: './dist/domain-client/index.d.ts', import: './dist/domain-client/index.js' },
    './application-server': { types: './dist/application-server/index.d.ts', import: './dist/application-server/index.js' },
    './infrastructure-server': { types: './dist/infrastructure-server/index.d.ts', import: './dist/infrastructure-server/index.js' },
  };

  if (mod.hasAppClient) {
    exports['./application-client'] = { types: './dist/application-client/index.d.ts', import: './dist/application-client/index.js' };
  }
  if (mod.hasInfraClient) {
    exports['./infrastructure-client'] = { types: './dist/infrastructure-client/index.d.ts', import: './dist/infrastructure-client/index.js' };
  }

  const deps = {
    '@dailyuse/contracts': 'workspace:*',
    '@dailyuse/database': 'workspace:*',
    '@dailyuse/domain-shared': 'workspace:*',
    '@dailyuse/utils': 'workspace:*',
    'zod': '^3.24.0',
  };

  // Add express for infrastructure-server modules
  deps['express'] = '^5.1.0';

  const packageJson = {
    name: `@dailyuse/${mod.name}`,
    version: '0.0.1',
    description: mod.description,
    type: 'module',
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports,
    scripts: {},
    dependencies: deps,
    devDependencies: {
      '@types/express': '^5.0.0',
    },
  };

  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`[OK] ${mod.name}/package.json`);

  // ============ tsconfig.json ============
  const tsconfig = {
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      baseUrl: '.',
      lib: ['ES2020'],
      types: ['node', 'vitest/globals'],
      paths: {
        '@/*': ['./src/*'],
        '@dailyuse/database': ['../database/src/index.ts'],
        '@dailyuse/domain-shared': ['../domain-shared/src/index.ts'],
        '@dailyuse/domain-shared/*': ['../domain-shared/src/*/index.ts'],
        '@dailyuse/contracts': ['../contracts/src/index.ts'],
        '@dailyuse/contracts/*': ['../contracts/src/modules/*/index.ts'],
        '@dailyuse/utils': ['../utils/src/index.ts'],
      },
    },
    include: ['src'],
    exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
  };

  fs.writeFileSync(path.join(pkgDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n');
  console.log(`[OK] ${mod.name}/tsconfig.json`);

  // ============ tsup.config.ts ============
  const entries = [
    `'src/index.ts'`,
    `'src/domain-shared/index.ts'`,
    `'src/domain-server/index.ts'`,
    `'src/domain-client/index.ts'`,
    `'src/application-server/index.ts'`,
    `'src/infrastructure-server/index.ts'`,
  ];
  if (mod.hasAppClient) entries.push(`'src/application-client/index.ts'`);
  if (mod.hasInfraClient) entries.push(`'src/infrastructure-client/index.ts'`);

  const tsupConfig = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    ${entries.join(',\n    ')},
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@dailyuse/utils',
    '@dailyuse/contracts',
    '@dailyuse/database',
    '@dailyuse/domain-shared',
    '@dailyuse/domain-shared/shared',
    'express',
    'zod',
  ],
});
`;

  fs.writeFileSync(path.join(pkgDir, 'tsup.config.ts'), tsupConfig);
  console.log(`[OK] ${mod.name}/tsup.config.ts`);

  // ============ project.json ============
  const projectJson = {
    name: mod.name,
    $schema: '../../node_modules/nx/schemas/project-schema.json',
    sourceRoot: `packages/${mod.name}/src`,
    projectType: 'library',
    tags: [`scope:${mod.name}`, 'type:lib'],
    targets: {
      build: {
        executor: 'nx:run-commands',
        outputs: ['{projectRoot}/dist'],
        options: {
          command: 'tsup',
          cwd: `packages/${mod.name}`,
        },
        dependsOn: ['^build', 'database:build'],
      },
      lint: {
        executor: '@nx/eslint:lint',
        outputs: ['{options.outputFile}'],
        options: {
          lintFilePatterns: [`packages/${mod.name}/**/*.{ts,js}`],
        },
      },
      typecheck: {
        executor: 'nx:run-commands',
        options: {
          command: 'tsc --noEmit',
          cwd: `packages/${mod.name}`,
        },
      },
    },
  };

  fs.writeFileSync(path.join(pkgDir, 'project.json'), JSON.stringify(projectJson, null, 2) + '\n');
  console.log(`[OK] ${mod.name}/project.json`);
}

console.log('\n=== Package configs created successfully ===');
