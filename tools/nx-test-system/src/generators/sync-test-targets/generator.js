"use strict";

const { formatFiles, getProjects, joinPathFragments, updateProjectConfiguration } = require("@nx/devkit");

const governedDomainProjects = new Set([
  "account",
  "ai",
  "authentication",
  "domain-shared",
  "goal",
  "governance",
  "notification",
  "reminder",
  "schedule",
  "setting",
  "task",
]);

const boundaryRequiredTargets = new Map([
  ["api", ["test", "test:watch", "test:smoke"]],
  ["task", ["test", "test:watch", "test:integration", "test:bench"]],
  ["desktop", ["test", "test:watch", "test:ipc", "test:main"]],
  ["web", ["test", "test:watch", "e2e", "e2e:sync"]],
]);

const governedRequiredTargets = ["test", "test:watch", "test:coverage"];

function createVitestCommand(cwd, args) {
  const executable = cwd
    ? `${relativeWorkspaceRoot(cwd)}/node_modules/vitest/vitest.mjs`
    : './node_modules/vitest/vitest.mjs';

  return `node ${executable} ${args}`;
}

function relativeWorkspaceRoot(projectRoot) {
  return projectRoot
    .split(/[\\/]/)
    .filter(Boolean)
    .map(() => '..')
    .join('/') || '.';
}

function createBoundaryTargetTemplates(projectName) {
  const templates = {
    api: {
      test: {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/{projectRoot}"],
        inputs: ["default", "^production"],
        cache: true,
        options: {
          command: createVitestCommand(null, "run --config apps/api/vitest.config.ts"),
        },
      },
      "test:watch": {
        executor: "nx:run-commands",
        cache: false,
        options: {
          command: createVitestCommand(null, "--config apps/api/vitest.config.ts"),
        },
      },
      "test:smoke": {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/{projectRoot}-smoke"],
        inputs: ["default", "^production"],
        cache: true,
        options: {
          command: createVitestCommand(null, "run --config apps/api/vitest.smoke.config.ts"),
        },
      },
    },
    task: {
      test: {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/{projectRoot}"],
        inputs: ["default", "^production"],
        cache: true,
        options: {
          command: createVitestCommand("packages/task", "run --config vitest.config.ts"),
          cwd: "packages/task",
        },
      },
      "test:watch": {
        executor: "nx:run-commands",
        cache: false,
        options: {
          command: createVitestCommand("packages/task", "--config vitest.config.ts"),
          cwd: "packages/task",
        },
      },
      "test:integration": {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/{projectRoot}"],
        inputs: ["default", "^production"],
        cache: false,
        options: {
          command: createVitestCommand("packages/task", "run --config vitest.integration.config.ts"),
          cwd: "packages/task",
        },
      },
      "test:bench": {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/{projectRoot}-bench"],
        inputs: ["default", "^production"],
        cache: false,
        options: {
          command: createVitestCommand("packages/task", "run --config vitest.performance.config.ts -t \"acceptable time\""),
          cwd: "packages/task",
        },
      },
    },
    desktop: {
      test: {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/{projectRoot}"],
        inputs: ["default", "^production"],
        cache: true,
        options: {
          command: createVitestCommand(null, "run --config apps/desktop/vitest.config.ts"),
        },
      },
      "test:watch": {
        executor: "nx:run-commands",
        cache: false,
        options: {
          command: createVitestCommand(null, "--config apps/desktop/vitest.config.ts"),
        },
      },
      "test:ipc": {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/apps/desktop-ipc"],
        options: {
          command: createVitestCommand("apps/desktop", "run --config vitest.ipc.config.ts"),
          cwd: "apps/desktop",
        },
      },
      "test:main": {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/apps/desktop-main"],
        options: {
          command: createVitestCommand("apps/desktop", "run --config vitest.main.config.ts"),
          cwd: "apps/desktop",
        },
      },
    },
    web: {
      test: {
        executor: "nx:run-commands",
        outputs: ["{workspaceRoot}/coverage/{projectRoot}"],
        inputs: ["default", "^production"],
        cache: true,
        options: {
          command: createVitestCommand(null, "run --config apps/web/vitest.config.ts"),
        },
      },
      "test:watch": {
        executor: "nx:run-commands",
        cache: false,
        options: {
          command: createVitestCommand(null, "--config apps/web/vitest.config.ts"),
        },
      },
      e2e: {
        executor: "nx:run-commands",
        outputs: [
          "{workspaceRoot}/apps/web/test-results",
          "{workspaceRoot}/apps/web/playwright-report",
        ],
        options: {
          command: "playwright test",
          cwd: "apps/web",
        },
        configurations: {
          ci: {
            command: "playwright test --reporter=html,json,list",
          },
          headed: {
            command: "playwright test --headed",
          },
          debug: {
            command: "playwright test --debug",
          },
        },
      },
      "e2e:sync": {
        executor: "nx:run-commands",
        outputs: [
          "{workspaceRoot}/apps/web/test-results",
          "{workspaceRoot}/apps/web/playwright-sync-report",
        ],
        options: {
          command: "playwright test --config playwright.sync.config.ts",
          cwd: "apps/web",
        },
        configurations: {
          headed: {
            command: "playwright test --config playwright.sync.config.ts --headed",
          },
          debug: {
            command: "playwright test --config playwright.sync.config.ts --debug",
          },
        },
      },
    },
  };

  return templates[projectName] ?? null;
}

function createLocalVitestTargetTemplates(projectRoot, includeCoverage = false) {
  const templates = {
    test: {
      executor: "nx:run-commands",
      outputs: ["{workspaceRoot}/coverage/{projectRoot}"],
      inputs: ["default", "^production"],
      cache: true,
      options: {
        command: createVitestCommand(projectRoot, "run --config vitest.config.ts"),
        cwd: projectRoot,
      },
    },
    "test:watch": {
      executor: "nx:run-commands",
      cache: false,
      options: {
        command: createVitestCommand(projectRoot, "--config vitest.config.ts"),
        cwd: projectRoot,
      },
    },
  };

  if (includeCoverage) {
    templates["test:coverage"] = {
      executor: "nx:run-commands",
      outputs: ["{workspaceRoot}/coverage/{projectRoot}"],
      inputs: ["default", "^production"],
      cache: true,
      options: {
        command: createVitestCommand(projectRoot, "run --config vitest.config.ts --coverage"),
        cwd: projectRoot,
      },
    };
  }

  return templates;
}

async function syncTestTargetsGenerator(tree, schema = {}) {
  const changedProjects = [];
  const changedFiles = [];
  const matchedProjects = [];
  const missingTargets = [];
  const projects = getProjects(tree);

  for (const [projectName, projectConfig] of projects.entries()) {
    if (!matchesProjectFilter(projectName, projectConfig.root, schema.project)) {
      continue;
    }

    matchedProjects.push(projectName);
    const targets = { ...(projectConfig.targets ?? {}) };
    const projectRoot = projectConfig.root;
    const hasLocalVitestConfig = tree.exists(joinPathFragments(projectRoot, "vitest.config.ts"));
    const isBoundaryProject = boundaryRequiredTargets.has(projectName);
    const isGovernedDomainProject = governedDomainProjects.has(projectName);
    let changed = false;

    if (targets["test:performance"]) {
      if (!targets["test:bench"]) {
        targets["test:bench"] = cloneTarget(targets["test:performance"]);
      }
      delete targets["test:performance"];
      changed = true;
    }

    if (!targets["test:watch"]) {
      const watchTarget = deriveWatchTarget(targets.test);
      if (watchTarget) {
        targets["test:watch"] = watchTarget;
        changed = true;
      }
    }

    const targetTemplates = createBoundaryTargetTemplates(projectName);
    if (targetTemplates) {
      for (const [targetName, targetTemplate] of Object.entries(targetTemplates)) {
        if (!areTargetsEqual(targets[targetName], targetTemplate)) {
          targets[targetName] = cloneTarget(targetTemplate);
          changed = true;
        }
      }
    }

    const shouldNormalizeLocalVitestTargets =
      hasLocalVitestConfig &&
      !isBoundaryProject &&
      (
        isGovernedDomainProject
        || usesVitest(targets.test)
        || usesVitest(targets["test:watch"])
        || usesVitest(targets["test:coverage"])
      );

    if (shouldNormalizeLocalVitestTargets) {
      const localVitestTargets = createLocalVitestTargetTemplates(projectRoot, isGovernedDomainProject);
      for (const [targetName, targetTemplate] of Object.entries(localVitestTargets)) {
        if (!areTargetsEqual(targets[targetName], targetTemplate)) {
          targets[targetName] = cloneTarget(targetTemplate);
          changed = true;
        }
      }
    } else if (isGovernedDomainProject && hasLocalVitestConfig) {
      const coverageTarget = createLocalVitestTargetTemplates(projectRoot, true)["test:coverage"];
      if (!areTargetsEqual(targets["test:coverage"], coverageTarget)) {
        targets["test:coverage"] = cloneTarget(coverageTarget);
        changed = true;
      }
    }

    const requiredTargets = boundaryRequiredTargets.get(projectName) ?? [];
    for (const targetName of requiredTargets) {
      if (!targets[targetName]) {
        missingTargets.push(
          `${projectName}: missing required target "${targetName}" in ${joinPathFragments(projectConfig.root, "project.json")}`,
        );
      }
    }

    if (isGovernedDomainProject) {
      for (const targetName of governedRequiredTargets) {
        if (!targets[targetName]) {
          missingTargets.push(
            `${projectName}: missing required target "${targetName}" in ${joinPathFragments(projectRoot, "project.json")}`,
          );
        }
      }
    }

    if (targets.test && usesVitest(targets.test) && !targets["test:watch"]) {
      missingTargets.push(
        `${projectName}: vitest test target requires "test:watch" in ${joinPathFragments(projectRoot, "project.json")}`,
      );
    }

    if (changed) {
      updateProjectConfiguration(tree, projectName, {
        ...projectConfig,
        targets,
      });
      changedProjects.push(projectName);
      changedFiles.push(joinPathFragments(projectConfig.root, "project.json"));
    }
  }

  if (schema.project && matchedProjects.length === 0) {
    throw new Error(`[sync-test-targets] no project matched filter "${schema.project}".`);
  }

  if (missingTargets.length > 0) {
    throw new Error(
      `[sync-test-targets] unresolved target issues:\n${missingTargets.map((issue) => `- ${issue}`).join("\n")}`,
    );
  }

  if (changedProjects.length > 0) {
    await formatFiles(tree);
  }
}

function deriveWatchTarget(testTarget) {
  if (!testTarget || testTarget.executor !== "nx:run-commands" || !usesVitest(testTarget)) {
    return null;
  }

  const options = testTarget.options ?? {};
  const testCommand = pickCommand(options);
  if (!testCommand || !testCommand.includes("vitest")) {
    return null;
  }

  const watchCommand = testCommand
    .replace(/\bvitest\s+run\b/, "vitest")
    .replace(/vitest\.mjs\s+run\b/, "vitest.mjs");
  if (watchCommand === testCommand) {
    return null;
  }

  const watchOptions = { command: watchCommand };
  if (options.cwd) {
    watchOptions.cwd = options.cwd;
  }

  return {
    executor: "nx:run-commands",
    cache: false,
    options: watchOptions,
  };
}

function usesVitest(target) {
  if (!target || target.executor !== "nx:run-commands") {
    return false;
  }

  const command = pickCommand(target.options ?? {});
  return typeof command === "string" && command.includes("vitest");
}

function pickCommand(options) {
  if (typeof options.command === "string") {
    return options.command;
  }

  if (Array.isArray(options.commands) && options.commands.length === 1) {
    const first = options.commands[0];
    if (typeof first === "string") {
      return first;
    }
    if (first && typeof first.command === "string") {
      return first.command;
    }
  }

  return null;
}

function matchesProjectFilter(projectName, projectRoot, filter) {
  if (!filter) {
    return true;
  }

  const normalizedFilter = filter.replaceAll("\\", "/");
  return (
    projectName === normalizedFilter ||
    joinPathFragments(projectRoot, "project.json") === normalizedFilter
  );
}

function cloneTarget(target) {
  return JSON.parse(JSON.stringify(target));
}

function areTargetsEqual(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

module.exports = syncTestTargetsGenerator;
module.exports.default = syncTestTargetsGenerator;
