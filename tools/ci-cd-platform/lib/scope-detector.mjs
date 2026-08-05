import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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
    .split(/\r?\n/u)
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
