#!/usr/bin/env node

function parseTimestamp(value, field) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be an ISO-8601 timestamp`);
  return timestamp;
}

export function summarizeGitHubRun({ run, jobs, now = Date.now() }) {
  if (!run || typeof run !== 'object') throw new Error('GitHub run metadata is required');
  if (!jobs || !Array.isArray(jobs.jobs) || !Number.isInteger(jobs.total_count)) {
    throw new Error('GitHub job metadata is required');
  }
  if (jobs.total_count > jobs.jobs.length) {
    throw new Error('GitHub job metadata is incomplete; pagination is required');
  }
  const startedAtMs = parseTimestamp(run.run_started_at, 'run_started_at');
  if (!Number.isFinite(now) || now < startedAtMs)
    throw new Error('current time precedes run start');

  const runnerMs = jobs.jobs.reduce((total, job) => {
    if (!job.started_at) return total;
    const jobStartedAt = parseTimestamp(job.started_at, 'job.started_at');
    const jobCompletedAt = job.completed_at
      ? parseTimestamp(job.completed_at, 'job.completed_at')
      : now;
    if (jobCompletedAt < jobStartedAt) throw new Error('job completion precedes job start');
    return total + (jobCompletedAt - jobStartedAt);
  }, 0);

  return {
    startedAt: new Date(startedAtMs).toISOString(),
    runnerMinutes: runnerMs / 60_000,
  };
}

async function githubApi(path, { apiUrl, token }) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with ${response.status}`);
  }
  return response.json();
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  if (!token) throw new Error('GITHUB_TOKEN is required');
  if (!repository || !/^[^/]+\/[^/]+$/u.test(repository)) {
    throw new Error('GITHUB_REPOSITORY must be owner/repository');
  }
  if (!runId || !/^\d+$/u.test(runId)) throw new Error('GITHUB_RUN_ID must be numeric');

  const [run, jobs] = await Promise.all([
    githubApi(`/repos/${repository}/actions/runs/${runId}`, { apiUrl, token }),
    githubApi(`/repos/${repository}/actions/runs/${runId}/jobs?filter=all&per_page=100`, {
      apiUrl,
      token,
    }),
  ]);
  const metrics = summarizeGitHubRun({ run, jobs });
  if (process.argv.includes('--github-output')) {
    console.log(`started_at=${metrics.startedAt}`);
    console.log(`runner_minutes=${metrics.runnerMinutes.toFixed(6)}`);
    return;
  }
  console.log(JSON.stringify(metrics, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`[github-run-metrics] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
