import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const exec = promisify(execFile);
const bootstrap = path.resolve('tools/ci/node-process-bootstrap.cjs');
export const SCOPE_VERSION = 1;

async function nxProjects(args, cwd) {
  const { stdout } = await exec('pnpm', ['exec', 'nx', 'show', 'projects', ...args], {
    cwd,
    maxBuffer: 4 * 1024 * 1024,
    env: {
      ...process.env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require=${bootstrap}`.trim(),
    },
  });
  return stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)
    .sort();
}

export async function detectScope({
  root = process.cwd(),
  base = process.env.NX_BASE,
  head = process.env.NX_HEAD,
  full = false,
} = {}) {
  const common = full
    ? []
    : ['--affected', ...(base && head ? [`--base=${base}`, `--head=${head}`] : [])];
  const projects = await nxProjects(common, root);
  const target = async (name) => nxProjects([...common, `--with-target=${name}`], root);
  const [unit, coverage, smoke, integration, boundary, perf] = await Promise.all([
    target('test'),
    target('test:coverage'),
    target('test:smoke'),
    target('test:integration'),
    target('test:boundary'),
    target('test:perf'),
  ]);
  const webFlow = projects.some((project) => ['web', 'api', 'ai-service'].includes(project));
  return {
    version: SCOPE_VERSION,
    base: base ?? null,
    head: head ?? null,
    full,
    projects,
    unit,
    coverage,
    smoke,
    integration,
    boundary,
    perf,
    webFlow,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const scope = await detectScope({ full: process.argv.includes('--full') });
    if (process.env.SCOPE_OUTPUT) {
      const target = path.resolve(process.env.SCOPE_OUTPUT);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, `${JSON.stringify(scope, null, 2)}\n`);
    }
    if (process.env.GITHUB_OUTPUT) {
      const lines = [
        `unit=${scope.unit.join(',')}`,
        `coverage=${scope.coverage.join(',')}`,
        `smoke=${scope.smoke.join(',')}`,
        `integration=${scope.integration.join(',')}`,
        `boundary=${scope.boundary.join(',')}`,
        `has_unit=${scope.unit.length > 0}`,
        `has_coverage=${scope.coverage.length > 0}`,
        `has_smoke=${scope.smoke.length > 0}`,
        `has_integration=${scope.integration.length > 0}`,
        `has_boundary=${scope.boundary.length > 0 || scope.smoke.length > 0}`,
        `has_desktop_boundary=${scope.boundary.length > 0}`,
        `has_perf=${scope.perf.length > 0}`,
        `has_web_flow=${scope.webFlow}`,
      ];
      await appendFile(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
    }
    process.stdout.write(`${JSON.stringify(scope, null, 2)}\n`);
  } catch (error) {
    console.error(`[scope-detector] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
