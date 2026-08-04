#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { classifyFailure } from './lib/failure-classification.mjs';

const separator = process.argv.indexOf('--');
if (separator < 0 || separator === process.argv.length - 1) {
  console.error('Usage: node run-command.mjs -- <command> [...args]');
  process.exit(2);
}
const [command, ...args] = process.argv.slice(separator + 1);
const reportName = process.env.TEST_REPORT_NAME ?? 'command';
const reportsDir = process.env.TEST_REPORTS_DIR ?? 'reports/test-system-v2';

async function run(attempt) {
  const startedAt = new Date();
  const chunks = [];
  const result = await new Promise((resolve) => {
    const child = spawn(command, args, { env: process.env, shell: process.platform === 'win32' });
    child.stdout?.on('data', (chunk) => {
      chunks.push(chunk);
      process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      chunks.push(chunk);
      process.stderr.write(chunk);
    });
    child.on('error', (error) => resolve({ exitCode: 1, signal: null, error }));
    child.on('close', (exitCode, signal) =>
      resolve({ exitCode: exitCode ?? 1, signal, error: null }),
    );
  });
  const output = Buffer.concat(chunks).toString('utf8');
  return {
    attempt,
    command: [command, ...args],
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    exitCode: result.exitCode,
    signal: result.signal,
    classification: classifyFailure({ exitCode: result.exitCode, signal: result.signal, output }),
  };
}

const attempts = [await run(1)];
if (['infrastructure', 'process-crash'].includes(attempts[0].classification))
  attempts.push(await run(2));
const final = attempts.at(-1);
const report = {
  version: 1,
  name: reportName,
  flaky: attempts.length > 1 && final.exitCode === 0,
  attempts,
  result: final.exitCode === 0 ? 'success' : 'failure',
};
await mkdir(reportsDir, { recursive: true });
await writeFile(
  path.join(reportsDir, `${reportName}.json`),
  `${JSON.stringify(report, null, 2)}\n`,
);
const escapedName = reportName
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('"', '&quot;');
const junit = `<testsuite name="${escapedName}" tests="1" failures="${final.exitCode === 0 ? 0 : 1}" time="${(final.durationMs / 1000).toFixed(3)}"><testcase classname="${escapedName}" name="command" time="${(final.durationMs / 1000).toFixed(3)}">${final.exitCode === 0 ? '' : `<failure type="${final.classification}"/>`}</testcase></testsuite>`;
await writeFile(path.join(reportsDir, `${reportName}.junit.xml`), `${junit}\n`);
console.log(
  `[test-system-v2] ${reportName}: ${report.result}; ${final.classification}; ${final.durationMs}ms`,
);
process.exitCode = final.exitCode;
