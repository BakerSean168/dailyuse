/**
 * Compare running local Docker image OCI revision labels against git HEAD.
 * Returns warnings when images lag the workspace tip (status drift).
 */

import { spawnSync } from 'node:child_process';

const DEFAULT_IMAGES = [
  'memoflow-api:local',
  'memoflow-web:local',
  'memoflow-ai-service:local',
];

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

  const headResult = run('git', ['rev-parse', 'HEAD'], { cwd: workspace });
  const headSha = headResult.exitCode === 0 ? headResult.stdout.trim() : '';
  const warnings = [];
  const comparisons = [];

  if (!headSha) {
    warnings.push('image-freshness: could not resolve git HEAD');
    return { headSha: '', warnings, comparisons };
  }

  const headShort = headSha.slice(0, 12);

  for (const image of images) {
    const inspect = run(
      'docker',
      ['image', 'inspect', image, '--format', '{{index .Config.Labels "org.opencontainers.image.revision"}}'],
      { cwd: workspace },
    );
    if (inspect.exitCode !== 0) {
      comparisons.push({ image, imageRevision: null, matches: null });
      // Missing image is not a hard failure for this advisory check
      continue;
    }
    const imageRevision = (inspect.stdout || '').trim() || null;
    const normalized = imageRevision?.replace(/-dirty$/u, '') ?? null;
    const matches =
      normalized != null &&
      (normalized === headSha ||
        normalized.startsWith(headShort) ||
        headSha.startsWith(normalized.slice(0, 12)));
    comparisons.push({ image, imageRevision, matches });
    if (imageRevision && !matches) {
      warnings.push(
        `image-freshness: ${image} revision=${imageRevision} lags HEAD=${headShort}… — rebuild with pnpm docker:local:rebuild before relying on local deploy`,
      );
    }
  }

  return { headSha, warnings, comparisons };
}
