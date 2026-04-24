import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const rawArgs = process.argv.slice(2);
const shouldWrite = rawArgs.includes('--write');
const projectFilter = getArgValue('--project');
const mode = shouldWrite ? 'write' : 'check';

const boundaryRequiredTargets = new Map([
  ['api', ['test', 'test:watch', 'test:smoke']],
  ['task', ['test', 'test:watch', 'test:integration', 'test:bench']],
  ['desktop', ['test', 'test:watch', 'test:ipc', 'test:main']],
  ['web', ['test', 'test:watch', 'e2e', 'e2e:sync']],
]);

const projectFiles = await findProjectJsonFiles(ROOT);
const errors = [];
const changes = [];
let matchedProjectCount = 0;

for (const projectFile of projectFiles) {
  const raw = await readFile(projectFile, 'utf8');
  const json = JSON.parse(raw);
  if (!matchesProjectFilter(projectFile, json.name, projectFilter)) {
    continue;
  }

  matchedProjectCount += 1;
  const targets = json.targets ?? {};
  let changed = false;

  if (targets['test:performance']) {
    if (!targets['test:bench']) {
      targets['test:bench'] = targets['test:performance'];
      changed = true;
    }
    delete targets['test:performance'];
    changed = true;
  }

  if (!targets['test:watch']) {
    const watchTarget = deriveWatchTarget(targets.test);
    if (watchTarget) {
      targets['test:watch'] = watchTarget;
      changed = true;
    }
  }

  const targetTemplates = getBoundaryTargetTemplates(json.name);
  if (shouldWrite && targetTemplates) {
    for (const [targetName, targetTemplate] of Object.entries(targetTemplates)) {
      if (!targets[targetName]) {
        targets[targetName] = structuredClone(targetTemplate);
        changed = true;
      }
    }
  }

  for (const [projectName, requiredTargets] of boundaryRequiredTargets.entries()) {
    if (json.name !== projectName) continue;
    for (const targetName of requiredTargets) {
      if (!targets[targetName]) {
        errors.push(`${json.name}: missing required target "${targetName}" in ${toRelative(projectFile)}`);
      }
    }
  }

  if (targets.test && usesVitest(targets.test) && !targets['test:watch']) {
    errors.push(`${json.name}: vitest test target requires "test:watch" in ${toRelative(projectFile)}`);
  }

  if (changed) {
    json.targets = targets;
    changes.push(toRelative(projectFile));
    if (shouldWrite) {
      await writeFile(projectFile, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
    }
  }
}

if (projectFilter && matchedProjectCount === 0) {
  console.error(
    `[test-target-governance] ${mode} failed: no project matched filter "${projectFilter}".`,
  );
  process.exit(1);
}

if (shouldWrite) {
  if (changes.length > 0) {
    console.log(`[test-target-governance] Updated ${changes.length} project.json files:`);
    for (const file of changes) {
      console.log(`  - ${file}`);
    }
  } else {
    console.log('[test-target-governance] No updates were needed.');
  }
}

if (errors.length > 0) {
  console.error(`[test-target-governance] ${mode} failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`[test-target-governance] ${mode} passed.`);

function deriveWatchTarget(testTarget) {
  if (!testTarget || testTarget.executor !== 'nx:run-commands' || !usesVitest(testTarget)) {
    return null;
  }

  const options = testTarget.options ?? {};
  const testCommand = pickCommand(options);
  if (!testCommand || !testCommand.includes('vitest')) {
    return null;
  }

  const watchCommand = testCommand.replace(/\bvitest\s+run\b/, 'vitest');
  if (watchCommand === testCommand) {
    return null;
  }

  const watchOptions = { command: watchCommand };
  if (options.cwd) {
    watchOptions.cwd = options.cwd;
  }

  return {
    executor: 'nx:run-commands',
    cache: false,
    options: watchOptions,
  };
}

function getBoundaryTargetTemplates(projectName) {
  const templates = {
    api: {
      test: {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
        inputs: ['default', '^production'],
        cache: true,
        options: {
          command: 'vitest run --config apps/api/vitest.config.ts',
        },
      },
      'test:watch': {
        executor: 'nx:run-commands',
        cache: false,
        options: {
          command: 'vitest --config apps/api/vitest.config.ts',
        },
      },
      'test:smoke': {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}-smoke'],
        inputs: ['default', '^production'],
        cache: true,
        options: {
          command: 'vitest run --config apps/api/vitest.smoke.config.ts',
        },
      },
    },
    task: {
      test: {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
        inputs: ['default', '^production'],
        cache: true,
        options: {
          command: 'vitest run --config vitest.config.ts',
          cwd: 'packages/task',
        },
      },
      'test:watch': {
        executor: 'nx:run-commands',
        cache: false,
        options: {
          command: 'vitest --config vitest.config.ts',
          cwd: 'packages/task',
        },
      },
      'test:integration': {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
        inputs: ['default', '^production'],
        cache: false,
        options: {
          command: 'vitest run --config vitest.integration.config.ts',
          cwd: 'packages/task',
        },
      },
      'test:bench': {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}-bench'],
        inputs: ['default', '^production'],
        cache: false,
        options: {
          command: 'vitest run --config vitest.performance.config.ts -t "acceptable time"',
          cwd: 'packages/task',
        },
      },
    },
    desktop: {
      test: {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
        inputs: ['default', '^production'],
        cache: true,
        options: {
          command: 'vitest run --config apps/desktop/vitest.config.ts',
        },
      },
      'test:watch': {
        executor: 'nx:run-commands',
        cache: false,
        options: {
          command: 'vitest --config apps/desktop/vitest.config.ts',
        },
      },
      'test:ipc': {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/apps/desktop-ipc'],
        options: {
          command: 'vitest run --config vitest.ipc.config.ts',
          cwd: 'apps/desktop',
        },
      },
      'test:main': {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/apps/desktop-main'],
        options: {
          command: 'vitest run --config vitest.main.config.ts',
          cwd: 'apps/desktop',
        },
      },
    },
    web: {
      test: {
        executor: 'nx:run-commands',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
        inputs: ['default', '^production'],
        cache: true,
        options: {
          command: 'vitest run --config apps/web/vitest.config.ts',
        },
      },
      'test:watch': {
        executor: 'nx:run-commands',
        cache: false,
        options: {
          command: 'vitest --config apps/web/vitest.config.ts',
        },
      },
      e2e: {
        executor: 'nx:run-commands',
        outputs: [
          '{workspaceRoot}/apps/web/test-results',
          '{workspaceRoot}/apps/web/playwright-report',
        ],
        options: {
          command: 'playwright test',
          cwd: 'apps/web',
        },
        configurations: {
          ci: {
            command: 'playwright test --reporter=html,json,list',
          },
          headed: {
            command: 'playwright test --headed',
          },
          debug: {
            command: 'playwright test --debug',
          },
        },
      },
      'e2e:sync': {
        executor: 'nx:run-commands',
        outputs: [
          '{workspaceRoot}/apps/web/test-results',
          '{workspaceRoot}/apps/web/playwright-sync-report',
        ],
        options: {
          command: 'playwright test --config playwright.sync.config.ts',
          cwd: 'apps/web',
        },
        configurations: {
          headed: {
            command: 'playwright test --config playwright.sync.config.ts --headed',
          },
          debug: {
            command: 'playwright test --config playwright.sync.config.ts --debug',
          },
        },
      },
    },
  };

  return templates[projectName] ?? null;
}

function usesVitest(target) {
  if (!target || target.executor !== 'nx:run-commands') {
    return false;
  }

  const options = target.options ?? {};
  const command = pickCommand(options);
  return typeof command === 'string' && command.includes('vitest');
}

function pickCommand(options) {
  if (typeof options.command === 'string') {
    return options.command;
  }

  if (Array.isArray(options.commands) && options.commands.length === 1) {
    const first = options.commands[0];
    if (typeof first === 'string') {
      return first;
    }
    if (first && typeof first.command === 'string') {
      return first.command;
    }
  }

  return null;
}

function getArgValue(flag) {
  const index = rawArgs.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return rawArgs[index + 1] ?? null;
}

function matchesProjectFilter(projectFile, projectName, filter) {
  if (!filter) {
    return true;
  }

  const normalizedFilter = filter.replaceAll('\\', '/');
  const relativePath = toRelative(projectFile);
  return projectName === normalizedFilter || relativePath === normalizedFilter;
}

async function findProjectJsonFiles(root) {
  const found = [];
  await walk(root, found);
  return found;
}

async function walk(dir, found) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, found);
      continue;
    }

    if (entry.isFile() && entry.name === 'project.json') {
      found.push(fullPath);
    }
  }
}

function toRelative(filePath) {
  return path.relative(ROOT, filePath).replaceAll('\\', '/');
}
