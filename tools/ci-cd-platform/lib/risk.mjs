const RISK_RANK = {
  docs: 0,
  package: 1,
  desktop: 2,
  runtime: 3,
  'web-flow': 4,
  root: 5,
  release: 6,
};

const RULES = [
  {
    level: 'release',
    reason: 'release or deployment configuration changed',
    test: (file) =>
      /^(\.github\/workflows\/(?:release(?:-[^/]+)?|publish-images)\.yml|(?:tools\/docker\/|tools\/ci-cd-platform\/release-tools\/)|Dockerfile)/u.test(
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
    level: 'desktop',
    reason: 'Desktop, Electron, or native packaging surface changed',
    test: (file) =>
      /(^apps\/desktop\/|^packages\/repository\/src\/electron\/|electron-builder|desktop-release)/iu.test(
        file,
      ),
  },
  {
    level: 'runtime',
    reason: 'API, database, Prisma, IPC, or integration runtime changed',
    test: (file) =>
      /(^apps\/api\/|^apps\/migrator\/|prisma|database|integration|smoke)/iu.test(file),
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
    const matching = RULES.filter((rule) => rule.test(file));
    const rules =
      matching.length > 0 ? matching : [{ level: 'root', reason: 'unclassified file changed' }];
    for (const rule of rules) {
      levels.set(rule.level, (levels.get(rule.level) ?? new Set()).add(rule.reason));
    }
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

export function selectLanes({ risk, scope, event = 'pull_request', full = scope.full === true }) {
  const matched = new Set(risk.matchedLevels ?? [risk.level]);
  const root = matched.has('root') || matched.has('release');
  const fullAudit = full || event === 'schedule' || event === 'workflow_dispatch';
  const has = (values) => fullAudit || (Array.isArray(values) && values.length > 0);
  return {
    governance: true,
    // Documentation-only changes still need governance, but do not need to
    // reserve validation runners. Full audits always exercise every lane.
    validate: fullAudit || risk.level !== 'docs',
    boundary: root || has(scope.boundary) || has(scope.smoke),
    integration: root || has(scope.integration),
    web:
      fullAudit ||
      root ||
      matched.has('web-flow') ||
      (Boolean(scope.webFlow) && !matched.has('desktop')),
    coverage: root || has(scope.coverage),
    performance: root || has(scope.perf),
  };
}
