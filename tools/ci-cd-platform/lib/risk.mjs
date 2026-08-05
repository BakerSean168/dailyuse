const RISK_RANK = {
  docs: 0,
  package: 1,
  runtime: 2,
  'web-flow': 3,
  root: 4,
  release: 5,
};

const RULES = [
  {
    level: 'release',
    reason: 'release or deployment configuration changed',
    test: (file) =>
      /^(\.github\/workflows\/(release|release-please|docker-deploy)|tools\/docker\/|Dockerfile)/u.test(
        file,
      ),
  },
  {
    level: 'root',
    reason: 'workspace, dependency, CI, or Nx configuration changed',
    test: (file) =>
      /(^|\/)(pnpm-lock\.yaml|package\.json|nx\.json|tsconfig[^/]*\.json|\.github\/workflows\/|\.github\/actions\/)/u.test(
        file,
      ),
  },
  {
    level: 'runtime',
    reason: 'API, database, Prisma, IPC, or integration runtime changed',
    test: (file) =>
      /(^apps\/api\/|^apps\/migrator\/|^apps\/desktop\/.*(main|ipc)|prisma|database|integration|smoke)/iu.test(
        file,
      ),
  },
  {
    level: 'web-flow',
    reason: 'Web application or browser flow changed',
    test: (file) => /(^apps\/web\/|playwright|e2e)/iu.test(file),
  },
  {
    level: 'package',
    reason: 'application or shared package source changed',
    test: (file) => /^(apps|packages)\//u.test(file),
  },
  {
    level: 'docs',
    reason: 'documentation or non-executable metadata changed',
    test: (file) => /^(docs|README|CHANGELOG|LICENSE)/iu.test(file),
  },
];

export function classifyRisk(changedFiles) {
  const levels = new Map();
  for (const file of changedFiles) {
    const matching = RULES.find((rule) => rule.test(file));
    const rule = matching ?? { level: 'root', reason: 'unclassified file changed' };
    levels.set(rule.level, (levels.get(rule.level) ?? new Set()).add(rule.reason));
  }

  if (levels.size === 0) {
    return {
      level: 'docs',
      reasons: ['no changed files; treating as docs-only'],
      matchedLevels: ['docs'],
    };
  }

  const matchedLevels = [...levels.keys()].sort(
    (left, right) => RISK_RANK[right] - RISK_RANK[left],
  );
  return {
    level: matchedLevels[0],
    matchedLevels,
    reasons: [...new Set([...levels.values()].flatMap((reasons) => [...reasons]))].sort(),
  };
}

export function selectLanes({ risk, scope, event = 'pull_request' }) {
  const root = risk.level === 'root' || risk.level === 'release';
  const fullAudit = event === 'schedule' || event === 'workflow_dispatch';
  const has = (values) => fullAudit || (Array.isArray(values) && values.length > 0);
  return {
    governance: true,
    validate: true,
    boundary: root || has(scope.boundary) || has(scope.smoke),
    integration: root || has(scope.integration),
    web: fullAudit || root || Boolean(scope.webFlow) || risk.level === 'web-flow',
    coverage: root || has(scope.coverage),
    performance: root || has(scope.perf),
  };
}
