import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const RELEASE_SUBJECT = /^chore\(main\): release (\d+\.\d+\.\d+)(?: \(#\d+\))?$/u;

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function resolveReleaseSubject(cwd) {
  const headSubject = git(cwd, ['log', '-1', '--pretty=%s']);
  if (RELEASE_SUBJECT.test(headSubject)) return headSubject;

  const parents = git(cwd, ['rev-list', '--parents', '-n', '1', 'HEAD']).split(/\s+/u).slice(1);
  if (parents.length !== 2) return headSubject;

  // Release PRs are intentionally merged with a merge commit so the release SHA
  // is the main-branch integration point. The second parent is the PR head and
  // retains release-please's conventional release subject.
  const mergedHeadSubject = git(cwd, ['log', '-1', '--pretty=%s', parents[1]]);
  return RELEASE_SUBJECT.test(mergedHeadSubject) ? mergedHeadSubject : headSubject;
}

export async function readReleaseContract({ cwd = process.cwd() } = {}) {
  const [rootPackage, desktopPackage, manifest, changelog] = await Promise.all([
    readFile(path.join(cwd, 'package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(cwd, 'apps/desktop/package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(cwd, '.release-please-manifest.json'), 'utf8').then(JSON.parse),
    readFile(path.join(cwd, 'CHANGELOG.md'), 'utf8'),
  ]);
  const subject = resolveReleaseSubject(cwd);
  const sha = git(cwd, ['rev-parse', 'HEAD']);
  const match = subject.match(RELEASE_SUBJECT);

  if (!match) {
    return {
      eligible: false,
      subject,
      sha,
      version: rootPackage.version,
      tag: `v${rootPackage.version}`,
      notes: '',
    };
  }

  const version = match[1];
  const identities = {
    releaseCommit: version,
    rootPackage: rootPackage.version,
    desktopPackage: desktopPackage.version,
    manifest: manifest['.'],
  };
  const mismatches = Object.entries(identities).filter(([, value]) => value !== version);
  if (mismatches.length > 0) {
    throw new Error(
      `release identity mismatch for ${version}: ${mismatches.map(([key, value]) => `${key}=${value}`).join(', ')}`,
    );
  }

  const heading = new RegExp(`^## \\[${escapeRegExp(version)}\\].*$`, 'mu');
  const headingMatch = heading.exec(changelog);
  if (!headingMatch) {
    throw new Error(`CHANGELOG.md has no release heading for ${version}`);
  }
  const start = headingMatch.index;
  const remainder = changelog.slice(start + headingMatch[0].length);
  const nextHeading = remainder.search(/^## \[/mu);
  const end = nextHeading < 0 ? changelog.length : start + headingMatch[0].length + nextHeading;
  const notes = changelog.slice(start, end).trim();

  return {
    eligible: true,
    subject,
    sha,
    version,
    tag: `v${version}`,
    notes,
  };
}

function parseArgs(argv) {
  const args = { requireRelease: false, githubOutput: false, expectedTag: '', writeNotes: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--require-release') args.requireRelease = true;
    else if (arg === '--github-output') args.githubOutput = true;
    else if (arg === '--expected-tag') args.expectedTag = argv[++index] ?? '';
    else if (arg === '--write-notes') args.writeNotes = argv[++index] ?? '';
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contract = await readReleaseContract();
  if (args.requireRelease && !contract.eligible) {
    throw new Error(`HEAD is not a release commit: ${contract.subject}`);
  }
  if (args.expectedTag && contract.tag !== args.expectedTag) {
    throw new Error(
      `release tag mismatch: expected ${args.expectedTag}, contract resolved ${contract.tag}`,
    );
  }
  if (args.writeNotes && contract.eligible) {
    await writeFile(args.writeNotes, `${contract.notes}\n`);
  }

  const outputs = {
    eligible: String(contract.eligible),
    sha: contract.sha,
    version: contract.version,
    tag: contract.tag,
    subject: contract.subject,
  };
  if (args.githubOutput) {
    const output = process.env.GITHUB_OUTPUT;
    if (!output) throw new Error('GITHUB_OUTPUT is required with --github-output');
    await writeFile(
      output,
      `${Object.entries(outputs)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')}\n`,
      {
        flag: 'a',
      },
    );
  } else {
    process.stdout.write(`${JSON.stringify({ ...contract, notes: undefined }, null, 2)}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
