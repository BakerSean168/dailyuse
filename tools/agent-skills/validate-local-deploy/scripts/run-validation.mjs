#!/usr/bin/env node

import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkLocalImageFreshness } from './image-freshness.mjs';
import { collectLocalDockerRuntimeEvidence } from './local-docker-evidence.mjs';
import {
  classifyValidationFailure,
  summarizeFailureClasses,
} from './validation-classification.mjs';
import { createLocalComposeRuntimeEnv, localComposeArgs } from '../../../docker/local-compose.mjs';

const DEFAULT_BASE_REF = 'main';
const DEFAULT_REPORT_DIR = 'reports/local-deploy-validation';
const LOCAL_DOCKER_PLAYWRIGHT_EVIDENCE =
  'reports/local-deploy-validation/local-docker-playwright-evidence.json';
const REQUIRED_DOCKER_SERVICES = ['api', 'web', 'powersync'];
const MAX_OUTPUT_CHARS = 4000;
const DOCKER_HEALTH_WAIT_TIMEOUT_MS = 90_000;
const DOCKER_HEALTH_POLL_INTERVAL_MS = 5_000;
const INCONCLUSIVE_DOCKER_PATTERNS = [
  'permission denied while trying to connect to the docker api',
  'error loading config file',
  'access is denied',
  'cannot find the file specified',
  'the system cannot find the file specified',
  'docker daemon',
  'is the docker daemon running',
  'failed to initialize: protocol not available',
];
const INCONCLUSIVE_COMMAND_PATTERNS = [
  'failed to initialize cache at',
  'appdata\\local\\uv\\cache',
  'access is denied',
  'permission denied',
  'operation not permitted',
  '拒绝访问',
];

function parseArgs(argv) {
  const options = {
    workspace: process.cwd(),
    baseRef: DEFAULT_BASE_REF,
    reportDir: DEFAULT_REPORT_DIR,
    history: true,
    includeUncommitted: true,
    dryRun: false,
    maxLogLines: 200,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith('--')) {
      throw new Error(`Missing value for argument: ${arg}`);
    }

    switch (key) {
      case 'workspace':
        options.workspace = next;
        break;
      case 'base-ref':
        options.baseRef = next;
        break;
      case 'report-dir':
        options.reportDir = next;
        break;
      case 'history':
        options.history = parseBoolean(next, arg);
        break;
      case 'include-uncommitted':
        options.includeUncommitted = parseBoolean(next, arg);
        break;
      case 'dry-run':
        options.dryRun = parseBoolean(next, arg);
        break;
      case 'max-log-lines':
        options.maxLogLines = Number.parseInt(next, 10);
        if (!Number.isFinite(options.maxLogLines) || options.maxLogLines <= 0) {
          throw new Error(`Invalid numeric value for ${arg}: ${next}`);
        }
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }

    index += 1;
  }

  options.workspace = path.resolve(options.workspace);
  return options;
}

function parseBoolean(value, flagName) {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  throw new Error(`Invalid boolean value for ${flagName}: ${value}`);
}

function normalizePath(value) {
  return value.replace(/\\/gu, '/');
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu, '');
}

function trimOutput(text, maxChars = MAX_OUTPUT_CHARS) {
  if (!text) {
    return '';
  }
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(text.length - maxChars);
}

function getCombinedText(...values) {
  return values
    .filter(Boolean)
    .map((value) => stripAnsi(String(value)))
    .join('\n')
    .toLowerCase();
}

function isDockerEnvironmentIssue(...values) {
  const combined = getCombinedText(...values);
  return INCONCLUSIVE_DOCKER_PATTERNS.some((pattern) => combined.includes(pattern));
}

function isCommandEnvironmentIssue(...values) {
  const combined = getCombinedText(...values);
  return INCONCLUSIVE_COMMAND_PATTERNS.some((pattern) => combined.includes(pattern));
}

function extractNxFlakyTasks(...values) {
  const combined = stripAnsi(values.filter(Boolean).join('\n'));
  const match = combined.match(
    /Nx detected\s+flaky task[s]?\s*([\s\S]*?)Flaky tasks can disrupt/iu,
  );

  if (!match) {
    return [];
  }

  return match[1]
    .split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter(Boolean);
}

function runCommand(command, args, options = {}) {
  const startTime = Date.now();
  const shouldUseCmdShim = process.platform === 'win32' && /\.(cmd|bat)$/iu.test(command);
  const spawnCommand = shouldUseCmdShim ? 'cmd.exe' : command;
  const spawnArgs = shouldUseCmdShim ? ['/d', '/s', '/c', command, ...args] : args;

  const result = spawnSync(spawnCommand, spawnArgs, {
    cwd: options.cwd,
    env: options.env,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: false,
  });

  const durationMs = Date.now() - startTime;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combinedOutput = [stdout, stderr].filter(Boolean).join('\n').trim();

  return {
    command,
    args,
    commandString: [command, ...args].join(' '),
    exitCode: typeof result.status === 'number' ? result.status : 1,
    durationMs,
    stdout,
    stderr,
    combinedOutput,
    outputTail: trimOutput(combinedOutput),
    error: result.error ? String(result.error.message ?? result.error) : null,
  };
}

function sleepMs(durationMs) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, durationMs);
}

function statusToCommandResult(label, execution, cwd, statusOverride = null) {
  const status = statusOverride ?? (execution.exitCode === 0 ? 'pass' : 'fail');
  return {
    label,
    cwd,
    command: execution.commandString,
    status,
    exitCode: execution.exitCode,
    durationMs: execution.durationMs,
    outputTail: execution.outputTail,
    error: execution.error,
    failureClass: null,
  };
}

function detectChangedFiles(workspace, baseRef, includeUncommitted, reportDirRelative) {
  const warnings = [];
  const changed = new Set();

  if (includeUncommitted) {
    const statusResult = runCommand('git', ['status', '--porcelain=v1'], { cwd: workspace });
    if (statusResult.exitCode !== 0) {
      warnings.push(`git status failed: ${statusResult.outputTail || 'unknown error'}`);
    } else {
      for (const rawLine of statusResult.stdout.split(/\r?\n/gu)) {
        const line = rawLine.trimEnd();
        if (!line) {
          continue;
        }

        const payload = line.slice(3);
        if (!payload) {
          continue;
        }

        const resolvedPath = normalizePath(
          payload.includes(' -> ') ? payload.split(' -> ').at(-1).trim() : payload.trim(),
        );
        const absolutePath = path.join(workspace, resolvedPath);
        const isDirectory =
          resolvedPath.endsWith('/') ||
          (existsSync(absolutePath) && lstatSync(absolutePath).isDirectory());

        if (!isDirectory) {
          changed.add(resolvedPath);
          continue;
        }

        const untrackedFiles = runCommand(
          'git',
          ['ls-files', '--others', '--exclude-standard', '--', resolvedPath],
          { cwd: workspace },
        );

        if (untrackedFiles.exitCode !== 0) {
          warnings.push(
            `git ls-files expansion failed for ${resolvedPath}: ${untrackedFiles.outputTail || 'unknown error'}`,
          );
          continue;
        }

        for (const fileLine of untrackedFiles.stdout.split(/\r?\n/gu)) {
          const file = normalizePath(fileLine.trim());
          if (file) {
            changed.add(file);
          }
        }
      }
    }
  }

  const diffResult = runCommand('git', ['diff', '--name-only', `${baseRef}...HEAD`], {
    cwd: workspace,
  });
  if (diffResult.exitCode !== 0) {
    warnings.push(`git diff ${baseRef}...HEAD failed: ${diffResult.outputTail || 'unknown error'}`);
  } else {
    for (const rawLine of diffResult.stdout.split(/\r?\n/gu)) {
      const line = rawLine.trim();
      if (line) {
        changed.add(normalizePath(line));
      }
    }
  }

  const filtered = [...changed]
    .filter((file) => file && !file.startsWith(`${reportDirRelative}/`))
    .sort((left, right) => left.localeCompare(right));

  return { changedFiles: filtered, warnings };
}

function isDocsOrGovernanceFile(file) {
  const normalized = normalizePath(file);
  const lower = normalized.toLowerCase();

  return (
    lower.endsWith('.md') ||
    normalized === 'AGENT.md' ||
    normalized === 'AGENTS.md' ||
    normalized === 'CLAUDE.md' ||
    normalized === '.github/copilot-instructions.md' ||
    normalized.startsWith('.github/prompts/')
  );
}

function isRuntimeSensitiveFile(file) {
  const normalized = normalizePath(file);
  const lower = normalized.toLowerCase();

  return (
    /^Dockerfile(\..+)?$/u.test(normalized) ||
    /^docker-compose(\..+)?\.ya?ml$/u.test(normalized) ||
    normalized.startsWith('tools/docker/') ||
    normalized.startsWith('docker/') ||
    normalized.startsWith('apps/api/') ||
    normalized.startsWith('apps/web/') ||
    normalized.startsWith('packages/ai/') ||
    normalized === 'Caddyfile' ||
    normalized === 'nginx.conf' ||
    /^\.env(\..+)?$/u.test(normalized) ||
    lower.includes('powersync') ||
    lower.includes('snapshot')
  );
}

function isDockerRebuildFile(file) {
  const normalized = normalizePath(file);
  return (
    /^Dockerfile(\..+)?$/u.test(normalized) ||
    /^docker-compose(\..+)?\.ya?ml$/u.test(normalized) ||
    normalized.startsWith('tools/docker/') ||
    normalized.startsWith('docker/')
  );
}

function getBranchAndSha(workspace) {
  const branchResult = runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: workspace });
  const shaResult = runCommand('git', ['rev-parse', 'HEAD'], { cwd: workspace });

  return {
    branch: branchResult.exitCode === 0 ? branchResult.stdout.trim() : 'unknown',
    headSha: shaResult.exitCode === 0 ? shaResult.stdout.trim() : 'unknown',
    warnings: [
      branchResult.exitCode === 0
        ? null
        : `git rev-parse --abbrev-ref HEAD failed: ${branchResult.outputTail || 'unknown error'}`,
      shaResult.exitCode === 0
        ? null
        : `git rev-parse HEAD failed: ${shaResult.outputTail || 'unknown error'}`,
    ].filter(Boolean),
  };
}

function ensureDir(directory) {
  mkdirSync(directory, { recursive: true });
}

function buildCommandPlan(options, changedFiles, categories) {
  const plan = [];
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const env = {
    ...process.env,
    CI: process.env.CI ?? 'true',
  };
  const affectedArgs = buildAffectedArgs(options);

  if (categories.docsGovernanceOnly) {
    plan.push({
      label: 'governance-check',
      command: pnpm,
      args: ['nx', 'run', 'memoflow:governance-check'],
      cwd: options.workspace,
      env,
    });
    return plan;
  }

  plan.push({
    label: 'affected-lint',
    command: pnpm,
    args: ['nx', 'affected', '-t', 'lint', ...affectedArgs],
    cwd: options.workspace,
    env,
  });
  plan.push({
    label: 'affected-typecheck',
    command: pnpm,
    args: ['nx', 'affected', '-t', 'typecheck', ...affectedArgs],
    cwd: options.workspace,
    env,
  });
  plan.push({
    label: 'affected-test',
    command: pnpm,
    args: ['nx', 'affected', '-t', 'test', ...affectedArgs],
    cwd: options.workspace,
    env,
  });

  if (categories.runtimeDeploySensitive) {
    plan.push({
      label: categories.dockerRebuildRequired ? 'docker-local-rebuild' : 'docker-local-up',
      command: pnpm,
      args: categories.dockerRebuildRequired ? ['docker:local:rebuild'] : ['docker:local:up'],
      cwd: options.workspace,
      env,
    });
  }

  return plan;
}

function buildAffectedArgs(options) {
  if (options.includeUncommitted) {
    return [`--base=${options.baseRef}`];
  }

  return [`--base=${options.baseRef}`, '--head=HEAD'];
}

function checkDockerPreconditions(workspace) {
  const issues = [];
  if (!existsSync(path.join(workspace, '.env.production.local'))) {
    issues.push('Missing required file: .env.production.local');
  }

  const dockerVersion = runCommand('docker', ['--version'], { cwd: workspace });
  if (dockerVersion.exitCode !== 0) {
    issues.push(`Docker is not available: ${dockerVersion.outputTail || 'unknown error'}`);
  }

  return issues;
}

function parseDockerPsJson(raw) {
  const text = raw.trim();
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return text
      .split(/\r?\n/gu)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
}

function isServiceHealthy(service) {
  return service && String(service.health).toLowerCase() === 'healthy';
}

function isServiceStillStarting(service) {
  if (!service) {
    return false;
  }

  const state = String(service.state ?? '').toLowerCase();
  const health = String(service.health ?? '').toLowerCase();
  const statusLine = String(service.statusLine ?? '').toLowerCase();

  return state === 'starting' || health === 'starting' || statusLine.includes('health: starting');
}

/**
 * Compose evidence must use the same runtime env as `pnpm docker:local:*`.
 * Bare `--env-file .env.production.local` omits POWERSYNC_* fallbacks that
 * local-compose injects from .env.development, so `compose ps/logs` fail
 * interpolation and falsely mark healthy services as missing.
 */
function getLocalComposeEvidenceContext(workspace) {
  const previousCwd = process.cwd();
  try {
    process.chdir(workspace);
    const env = createLocalComposeRuntimeEnv({ quiet: true });
    return {
      composeArgs: [...localComposeArgs],
      env,
    };
  } finally {
    process.chdir(previousCwd);
  }
}

function getDockerPsSnapshot(workspace) {
  const { composeArgs, env } = getLocalComposeEvidenceContext(workspace);
  const psResult = runCommand('docker', [...composeArgs, 'ps', '--format', 'json'], {
    cwd: workspace,
    env,
  });
  if (psResult.exitCode !== 0) {
    return {
      composeArgs,
      env,
      dockerServices: {},
      warnings: [`docker compose ps failed: ${psResult.outputTail || 'unknown error'}`],
    };
  }

  const services = {};
  const warnings = [];

  let entries = [];
  try {
    entries = parseDockerPsJson(psResult.stdout);
  } catch (error) {
    warnings.push(`Failed to parse docker compose ps output: ${String(error.message ?? error)}`);
  }

  for (const entry of entries) {
    const serviceName = entry.Service ?? entry.Name ?? 'unknown';
    services[serviceName] = {
      name: entry.Name ?? serviceName,
      state: entry.State ?? 'unknown',
      health: entry.Health ?? '',
      exitCode: entry.ExitCode ?? '',
      statusLine: entry.Status ?? '',
    };
  }

  return { composeArgs, env, dockerServices: services, warnings };
}

function collectDockerEvidence(workspace, maxLogLines) {
  let snapshot = getDockerPsSnapshot(workspace);
  const deadline = Date.now() + DOCKER_HEALTH_WAIT_TIMEOUT_MS;

  while (Object.keys(snapshot.dockerServices).length > 0 && Date.now() < deadline) {
    const hasStartingRequiredService = REQUIRED_DOCKER_SERVICES.some((serviceName) =>
      isServiceStillStarting(snapshot.dockerServices[serviceName]),
    );

    if (!hasStartingRequiredService) {
      break;
    }

    sleepMs(DOCKER_HEALTH_POLL_INTERVAL_MS);
    snapshot = getDockerPsSnapshot(workspace);
  }

  const { composeArgs, env, dockerServices: services, warnings } = snapshot;

  for (const serviceName of REQUIRED_DOCKER_SERVICES) {
    const service = services[serviceName];
    if (isServiceHealthy(service)) {
      continue;
    }

    const logResult = runCommand(
      'docker',
      [...composeArgs, 'logs', '--no-color', `--tail=${maxLogLines}`, serviceName],
      { cwd: workspace, env },
    );

    if (!services[serviceName]) {
      services[serviceName] = {
        name: serviceName,
        state: 'missing',
        health: '',
        exitCode: '',
        statusLine: '',
      };
    }

    services[serviceName].logExcerpt = trimOutput(logResult.combinedOutput);
    if (logResult.exitCode !== 0) {
      warnings.push(
        `docker compose logs failed for ${serviceName}: ${logResult.outputTail || 'unknown error'}`,
      );
    }
  }

  return { dockerServices: services, warnings };
}

function requiresLocalDockerBrowserProof(changedFiles) {
  return changedFiles.some(
    (file) =>
      file.startsWith('apps/web/e2e/local-docker/') ||
      file === 'apps/web/e2e/helpers/run-local-docker-playwright.mjs' ||
      file === 'apps/web/playwright.local-docker.config.ts',
  );
}

function readLocalDockerBrowserEvidence(workspace, expectedRevision, required) {
  const evidencePath = path.join(workspace, LOCAL_DOCKER_PLAYWRIGHT_EVIDENCE);
  if (!existsSync(evidencePath)) {
    return {
      required,
      ok: !required,
      path: LOCAL_DOCKER_PLAYWRIGHT_EVIDENCE,
      headRevision: null,
      browserRequest: null,
      error: required ? 'Local Docker Playwright evidence is missing.' : null,
    };
  }

  try {
    const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
    const revisionMatches = evidence.headRevision === expectedRevision;
    const evidenceValid =
      evidence.ok === true && evidence.browserRequest?.ok === true && revisionMatches;
    const ok = !required || evidenceValid;
    return {
      required,
      ok,
      path: LOCAL_DOCKER_PLAYWRIGHT_EVIDENCE,
      headRevision: evidence.headRevision ?? null,
      browserRequest: evidence.browserRequest ?? null,
      playwrightExitCode: evidence.playwrightExitCode ?? null,
      error:
        evidenceValid || !required
          ? null
          : revisionMatches
            ? 'Local Docker Playwright evidence did not include a successful browser request proof.'
            : `Local Docker Playwright evidence revision ${evidence.headRevision ?? 'missing'} does not match ${expectedRevision}.`,
    };
  } catch (error) {
    return {
      required,
      ok: false,
      path: LOCAL_DOCKER_PLAYWRIGHT_EVIDENCE,
      headRevision: null,
      browserRequest: null,
      error: `Local Docker Playwright evidence could not be read: ${String(error.message ?? error)}`,
    };
  }
}

function buildResults(commands) {
  const counts = {
    pass: 0,
    fail: 0,
    planned: 0,
    skipped: 0,
  };

  for (const command of commands) {
    counts[command.status] = (counts[command.status] ?? 0) + 1;
  }

  return {
    commandCounts: counts,
    allCommandsPassed:
      counts.fail === 0 && counts.pass > 0 && counts.planned === 0 && counts.skipped === 0,
  };
}

function buildRecommendedActions({
  verdict,
  changedFiles,
  categories,
  blockingIssues,
  dockerServices,
  dryRun,
}) {
  const actions = [];

  if (changedFiles.length === 0) {
    actions.push(
      'Confirm you are on the intended branch and that the target changes exist in the current working tree or compared base ref.',
    );
  }

  if (dryRun) {
    actions.push(
      'Rerun without --dry-run to execute the required validation commands and collect real evidence.',
    );
  }

  if (
    categories.runtimeDeploySensitive &&
    Object.keys(dockerServices).length === 0 &&
    verdict !== 'pass'
  ) {
    actions.push(
      'Ensure Docker is available and .env.production.local is configured before rerunning local deployment validation.',
    );
  }

  for (const issue of blockingIssues) {
    if (issue.includes('governance-check')) {
      actions.push(
        'Fix governance or documentation issues reported by memoflow:governance-check, then rerun validation.',
      );
    }
    if (issue.includes('affected-lint')) {
      actions.push('Resolve affected lint failures before considering the branch ready for PR.');
    }
    if (issue.includes('affected-typecheck')) {
      actions.push(
        'Resolve affected typecheck failures before considering the branch ready for PR.',
      );
    }
    if (issue.includes('affected-test')) {
      actions.push(
        'Fix the affected test failures or adjust the implementation until the default test target passes.',
      );
    }
    if (issue.includes('docker-local-up') || issue.includes('docker-local-rebuild')) {
      actions.push(
        'Repair the Docker startup or image build failure, then rerun local deployment verification.',
      );
    }
  }

  for (const serviceName of REQUIRED_DOCKER_SERVICES) {
    const service = dockerServices[serviceName];
    if (service && String(service.health).toLowerCase() !== 'healthy') {
      actions.push(
        `Investigate ${serviceName} service health and log excerpt, then rerun local deployment verification.`,
      );
    }
  }

  if (verdict === 'pass') {
    actions.push(
      'Use latest.md as the PR-facing validation summary and keep latest.json for follow-up automation or repair history.',
    );
  }

  return [...new Set(actions)];
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Local Deploy Validation Report');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Workspace: ${report.workspace}`);
  lines.push(`- Branch: ${report.branch}`);
  lines.push(`- HEAD: ${report.headSha}`);
  lines.push(`- Base ref: ${report.baseRef}`);
  lines.push(`- Verdict: ${report.verdict}`);
  lines.push(`- Ready for PR: ${report.readyForPr ? 'yes' : 'no'}`);
  lines.push('');
  lines.push('## Changed Files');
  lines.push('');
  if (report.changedFiles.length === 0) {
    lines.push('- none');
  } else {
    for (const file of report.changedFiles) {
      lines.push(`- ${file}`);
    }
  }

  lines.push('');
  lines.push('## Triggered Rules');
  lines.push('');
  lines.push(`- docsGovernanceOnly: ${report.changeCategories.docsGovernanceOnly}`);
  lines.push(`- codeOrConfig: ${report.changeCategories.codeOrConfig}`);
  lines.push(`- runtimeDeploySensitive: ${report.changeCategories.runtimeDeploySensitive}`);
  lines.push(`- dockerRebuildRequired: ${report.changeCategories.dockerRebuildRequired}`);

  lines.push('');
  lines.push('## Command Results');
  lines.push('');
  if (report.commands.length === 0) {
    lines.push('- none');
  } else {
    for (const command of report.commands) {
      lines.push(`- ${command.label}: ${command.status} (exit ${command.exitCode})`);
      lines.push(`  command: \`${command.command}\``);
      if (command.failureClass) {
        lines.push(`  failure class: ${command.failureClass}`);
      }
      if (command.outputTail) {
        lines.push('```text');
        lines.push(command.outputTail);
        lines.push('```');
      }
    }
  }

  lines.push('');
  lines.push('## Docker Services');
  lines.push('');
  if (Object.keys(report.dockerServices).length === 0) {
    lines.push('- none');
  } else {
    for (const serviceName of Object.keys(report.dockerServices).sort()) {
      const service = report.dockerServices[serviceName];
      lines.push(
        `- ${serviceName}: state=${service.state || 'unknown'}, health=${service.health || 'n/a'}`,
      );
      if (service.logExcerpt) {
        lines.push('```text');
        lines.push(service.logExcerpt);
        lines.push('```');
      }
    }
  }

  lines.push('');
  lines.push('## Local Docker Runtime Evidence');
  lines.push('');
  if (!report.localDockerRuntime) {
    lines.push('- not collected');
  } else {
    lines.push(`- result: ${report.localDockerRuntime.ok ? 'pass' : 'fail'}`);
    lines.push(`- expected revision: ${report.localDockerRuntime.expectedRevision || 'unknown'}`);
    for (const [serviceName, service] of Object.entries(report.localDockerRuntime.services ?? {})) {
      lines.push(
        `- ${serviceName}: listener=${service.listenerOpen ? 'open' : 'closed'} ${service.hostPort}->${service.targetPort}, mapping=${service.mappingMatches ? 'match' : 'mismatch'}, revision=${service.revisionMatches ? 'match' : 'mismatch'}`,
      );
      if (service.listenerOwner) {
        lines.push(`  listener owner: ${service.listenerOwner}`);
      }
    }
    for (const error of report.localDockerRuntime.errors ?? []) {
      lines.push(`- error: ${error}`);
    }
  }

  lines.push('');
  lines.push('## Browser Request Proof');
  lines.push('');
  if (!report.localDockerBrowserEvidence) {
    lines.push('- not required');
  } else {
    lines.push(`- required: ${report.localDockerBrowserEvidence.required}`);
    lines.push(`- result: ${report.localDockerBrowserEvidence.ok ? 'pass' : 'fail'}`);
    lines.push(`- evidence: ${report.localDockerBrowserEvidence.path}`);
    if (report.localDockerBrowserEvidence.browserRequest?.matchingLine) {
      lines.push(`- web log: ${report.localDockerBrowserEvidence.browserRequest.matchingLine}`);
    }
    if (report.localDockerBrowserEvidence.error) {
      lines.push(`- error: ${report.localDockerBrowserEvidence.error}`);
    }
  }

  lines.push('');
  lines.push('## Failure Classification');
  lines.push('');
  for (const [failureClass, count] of Object.entries(report.failureClasses)) {
    lines.push(`- ${failureClass}: ${count}`);
  }

  lines.push('');
  lines.push('## Blocking Issues');
  lines.push('');
  if (report.blockingIssues.length === 0) {
    lines.push('- none');
  } else {
    for (const issue of report.blockingIssues) {
      lines.push(`- ${issue}`);
    }
  }

  lines.push('');
  lines.push('## Warnings');
  lines.push('');
  if (report.warnings.length === 0) {
    lines.push('- none');
  } else {
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push('');
  lines.push('## Recommended Next Actions');
  lines.push('');
  if (report.recommendedNextActions.length === 0) {
    lines.push('- none');
  } else {
    for (const action of report.recommendedNextActions) {
      lines.push(`- ${action}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function writeReport(report, reportDir, historyEnabled) {
  ensureDir(reportDir);
  const stamp = report.generatedAt.replaceAll(':', '-');
  const latestJson = path.join(reportDir, 'latest.json');
  const latestMd = path.join(reportDir, 'latest.md');

  writeFileSync(latestJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(latestMd, renderMarkdown(report), 'utf8');

  if (historyEnabled) {
    writeFileSync(
      path.join(reportDir, `${stamp}.json`),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
    writeFileSync(path.join(reportDir, `${stamp}.md`), renderMarkdown(report), 'utf8');
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const reportDirAbsolute = path.resolve(options.workspace, options.reportDir);
  const reportDirRelative = normalizePath(
    path.relative(options.workspace, reportDirAbsolute) || options.reportDir,
  );

  const { branch, headSha, warnings: repoWarnings } = getBranchAndSha(options.workspace);
  const { changedFiles, warnings: diffWarnings } = detectChangedFiles(
    options.workspace,
    options.baseRef,
    options.includeUncommitted,
    reportDirRelative,
  );

  const categories = {
    docsGovernanceOnly: changedFiles.length > 0 && changedFiles.every(isDocsOrGovernanceFile),
    codeOrConfig: changedFiles.some((file) => !isDocsOrGovernanceFile(file)),
    runtimeDeploySensitive: changedFiles.some(isRuntimeSensitiveFile),
    dockerRebuildRequired: changedFiles.some(isDockerRebuildFile),
  };

  const warnings = [...repoWarnings, ...diffWarnings];
  const blockingIssues = [];
  const commandResults = [];
  const extraFailureClasses = [];
  let dockerServices = {};
  let imageFreshness = null;
  let localDockerRuntime = null;
  let localDockerBrowserEvidence = null;
  let hasHardFailure = false;
  let hasInconclusiveBlocker = false;

  if (changedFiles.length === 0) {
    hasInconclusiveBlocker = true;
    blockingIssues.push('No changed files detected for validation scope.');
  }

  const plan = changedFiles.length === 0 ? [] : buildCommandPlan(options, changedFiles, categories);

  if (options.dryRun && plan.length > 0) {
    hasInconclusiveBlocker = true;
    blockingIssues.push('Dry run requested; required validation commands were not executed.');
    for (const item of plan) {
      commandResults.push({
        label: item.label,
        cwd: item.cwd,
        command: [item.command, ...item.args].join(' '),
        status: 'planned',
        exitCode: 0,
        durationMs: 0,
        outputTail: '',
        error: null,
        failureClass: null,
      });
    }
  } else if (plan.length > 0) {
    if (categories.runtimeDeploySensitive) {
      const dockerPreconditions = checkDockerPreconditions(options.workspace);
      if (dockerPreconditions.length > 0) {
        hasInconclusiveBlocker = true;
        for (const issue of dockerPreconditions) {
          blockingIssues.push(issue);
        }
      }
    }

    for (const item of plan) {
      if (
        categories.runtimeDeploySensitive &&
        (item.label === 'docker-local-up' || item.label === 'docker-local-rebuild') &&
        hasInconclusiveBlocker
      ) {
        commandResults.push({
          label: item.label,
          cwd: item.cwd,
          command: [item.command, ...item.args].join(' '),
          status: 'skipped',
          exitCode: 1,
          durationMs: 0,
          outputTail: 'Skipped because Docker prerequisites are missing.',
          error: null,
          failureClass: null,
        });
        continue;
      }

      const execution = runCommand(item.command, item.args, {
        cwd: item.cwd,
        env: item.env,
      });
      const result = statusToCommandResult(item.label, execution, item.cwd);
      commandResults.push(result);
      const flakyTasks = extractNxFlakyTasks(
        execution.stdout,
        execution.stderr,
        execution.outputTail,
      );

      if (flakyTasks.length > 0) {
        warnings.push(`${item.label} reported Nx flaky tasks: ${flakyTasks.join(', ')}`);
      }

      if (result.status === 'fail') {
        const dockerInfraIssue =
          (item.label === 'docker-local-up' || item.label === 'docker-local-rebuild') &&
          isDockerEnvironmentIssue(execution.outputTail, execution.error);
        const commandEnvironmentIssue = isCommandEnvironmentIssue(
          execution.stdout,
          execution.stderr,
          execution.outputTail,
          execution.error,
        );
        result.failureClass = classifyValidationFailure({
          label: item.label,
          environmentIssue: dockerInfraIssue || commandEnvironmentIssue,
        });

        if (dockerInfraIssue) {
          hasInconclusiveBlocker = true;
          warnings.push(
            `${item.label} could not complete because the local Docker environment is inaccessible.`,
          );
          blockingIssues.push(
            `${item.label} could not complete because the local Docker environment is inaccessible.`,
          );
        } else if (commandEnvironmentIssue) {
          hasInconclusiveBlocker = true;
          warnings.push(
            `${item.label} could not complete because a local tool cache or host environment path is inaccessible.`,
          );
          blockingIssues.push(
            `${item.label} could not complete because a local tool cache or host environment path is inaccessible.`,
          );
        } else {
          hasHardFailure = true;
          blockingIssues.push(`${item.label} failed.`);
        }
      }
    }

    if (categories.runtimeDeploySensitive && !hasInconclusiveBlocker) {
      const dockerEvidence = collectDockerEvidence(options.workspace, options.maxLogLines);
      dockerServices = dockerEvidence.dockerServices;
      warnings.push(...dockerEvidence.warnings);

      if (Object.keys(dockerServices).length === 0) {
        hasInconclusiveBlocker = true;
        blockingIssues.push('Docker validation evidence could not be collected.');
      }

      for (const serviceName of REQUIRED_DOCKER_SERVICES) {
        const service = dockerServices[serviceName];
        if (!service) {
          continue;
        }

        if (String(service.health).toLowerCase() !== 'healthy') {
          hasHardFailure = true;
          extraFailureClasses.push('docker-deploy');
          blockingIssues.push(`${serviceName} is not healthy after local Docker validation.`);
        }
      }

      const runtimeContext = getLocalComposeEvidenceContext(options.workspace);
      localDockerRuntime = await collectLocalDockerRuntimeEvidence({
        workspace: options.workspace,
        env: runtimeContext.env,
        composeArgs: runtimeContext.composeArgs,
      });
      if (!localDockerRuntime.ok) {
        hasHardFailure = true;
        extraFailureClasses.push('docker-deploy');
        for (const error of localDockerRuntime.errors) {
          blockingIssues.push(`local-docker-runtime: ${error}`);
        }
      }

      imageFreshness = checkLocalImageFreshness(options.workspace, {
        expectedRevision: localDockerRuntime.expectedRevision,
        runCommand: (command, args, opts) => {
          const execution = runCommand(command, args, opts);
          return {
            exitCode: execution.exitCode,
            stdout: execution.stdout,
            stderr: execution.stderr,
          };
        },
      });
      warnings.push(...imageFreshness.warnings);

      const browserProofRequired = requiresLocalDockerBrowserProof(changedFiles);
      localDockerBrowserEvidence = readLocalDockerBrowserEvidence(
        options.workspace,
        localDockerRuntime.expectedRevision,
        browserProofRequired,
      );
      if (browserProofRequired && !localDockerBrowserEvidence.ok) {
        hasHardFailure = true;
        extraFailureClasses.push('docker-deploy');
        blockingIssues.push(localDockerBrowserEvidence.error);
      }
    }
  }

  const verdict = hasHardFailure ? 'fail' : hasInconclusiveBlocker ? 'inconclusive' : 'pass';

  const readyForPr = verdict === 'pass' && blockingIssues.length === 0;
  const results = buildResults(commandResults);
  const failureClasses = summarizeFailureClasses(commandResults, extraFailureClasses);
  const report = {
    generatedAt: new Date().toISOString(),
    workspace: options.workspace,
    branch,
    headSha,
    baseRef: options.baseRef,
    changedFiles,
    changeCategories: categories,
    commands: commandResults,
    results,
    dockerServices,
    imageFreshness,
    localDockerRuntime,
    localDockerBrowserEvidence,
    failureClasses,
    verdict,
    readyForPr,
    blockingIssues: [...new Set(blockingIssues)],
    warnings: [...new Set(warnings)],
    recommendedNextActions: buildRecommendedActions({
      verdict,
      changedFiles,
      categories,
      blockingIssues,
      dockerServices,
      dryRun: options.dryRun,
    }),
  };

  writeReport(report, reportDirAbsolute, options.history);

  console.log(`validation verdict: ${report.verdict}`);
  console.log(`ready for PR: ${report.readyForPr ? 'yes' : 'no'}`);
  console.log(`report written to: ${reportDirAbsolute}`);

  process.exit(report.readyForPr ? 0 : 1);
}

main().catch((error) => {
  console.error(String(error.message ?? error));
  process.exit(1);
});
