/**
 * Compare running local Docker image OCI revision labels against the exact workspace revision.
 * Dirty worktrees include a content fingerprint so stale evidence at the same HEAD is rejected.
 */

import { spawnSync } from 'node:child_process';
import { resolveWorkspaceRevision } from '../../../docker/local-compose.mjs';

const DEFAULT_IMAGES = ['memoflow-api:local', 'memoflow-web:local'];

/**
 * @param {string} workspace
 * @param {{ images?: string[], runCommand?: Function }} [options]
 * @returns {{ headSha: string, warnings: string[], comparisons: Array<{ image: string, imageRevision: string | null, matches: boolean | null }> }}
 */
export function checkLocalImageFreshness(workspace, options = {}) {
  const images = options.images ?? DEFAULT_IMAGES;
  const run =
    options.runCommand ??
    ((command, args, opts) => {
      const result = spawnSync(command, args, {
        cwd: opts?.cwd,
        encoding: 'utf8',
        env: opts?.env ?? process.env,
      });
      return {
        exitCode: typeof result.status === 'number' ? result.status : 1,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
      };
    });

  const workspaceRevision =
    options.expectedRevision ??
    resolveWorkspaceRevision({
      cwd: workspace,
      runCommand: run,
      readFile: options.readFile,
    });
  const headSha = workspaceRevision.split('-dirty-')[0] ?? '';
  const warnings = [];
  const comparisons = [];

  if (!workspaceRevision || workspaceRevision === 'unknown') {
    warnings.push('image-freshness: could not resolve workspace revision');
    return { headSha: '', workspaceRevision: '', warnings, comparisons };
  }

  for (const image of images) {
    const inspect = run(
      'docker',
      [
        'image',
        'inspect',
        image,
        '--format',
        '{{index .Config.Labels "org.opencontainers.image.revision"}}',
      ],
      { cwd: workspace },
    );
    if (inspect.exitCode !== 0) {
      comparisons.push({ image, imageRevision: null, matches: null });
      continue;
    }
    const imageRevision = (inspect.stdout || '').trim() || null;
    const matches = imageRevision != null && imageRevision === workspaceRevision;
    comparisons.push({ image, imageRevision, matches });
    if (imageRevision && !matches) {
      warnings.push(
        `image-freshness: ${image} revision=${imageRevision} does not match workspace=${workspaceRevision} — rebuild with pnpm docker:local:rebuild before relying on local deploy`,
      );
    }
  }

  return { headSha, workspaceRevision, warnings, comparisons };
}
