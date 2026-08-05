#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const ruleset = JSON.parse(await readFile('.github/rulesets/main.json', 'utf8'));
const required =
  ruleset.rules.find((rule) => rule.type === 'required_status_checks')?.parameters
    ?.required_status_checks ?? [];
const expected = [
  'Governance Oracle',
  'Validate Oracle',
  'Boundary Oracle',
  'Integration Oracle',
  'Web Flow Oracle',
  'Coverage Oracle',
  'Performance Oracle',
];
const actual = required.map((entry) => entry.context);
const pullRequestRule = ruleset.rules.find((rule) => rule.type === 'pull_request');
const reviewPolicy = pullRequestRule?.parameters;
const soloMaintainerPolicy =
  reviewPolicy?.required_approving_review_count === 0 &&
  reviewPolicy?.require_code_owner_review === false &&
  reviewPolicy?.require_last_push_approval === false;
if (
  ruleset.enforcement !== 'active' ||
  actual.join('\n') !== expected.join('\n') ||
  !soloMaintainerPolicy
) {
  console.error('[ruleset-check] enforcement or required Oracle contexts do not match');
  process.exit(1);
}
console.log(
  `[ruleset-check] active; ${actual.length} Oracle contexts; solo-maintainer review policy enabled`,
);
