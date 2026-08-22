import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveLocalDockerHostPorts } from './load-profiles.mjs';

const machinePorts = {
  API_HOST_PORT: '12136',
  WEB_HOST_PORT: '12137',
  POWERSYNC_HOST_PORT: '12139',
  POSTGRES_HOST_PORT: '12140',
  REDIS_HOST_PORT: '12141',
};

test('keeps the shared local-docker SSOT by default', () => {
  const result = resolveLocalDockerHostPorts(machinePorts);

  assert.equal(result.ok, true);
  assert.equal(result.forced.API_HOST_PORT, '53080');
  assert.equal(result.forced.WEB_HOST_PORT, '58080');
});

test('accepts an explicit machine-local port range', () => {
  const result = resolveLocalDockerHostPorts(machinePorts, { allowMachineOverride: true });

  assert.equal(result.ok, true);
  assert.deepEqual(result.forced, machinePorts);
});

test('rejects duplicate or reserved machine-local ports', () => {
  const result = resolveLocalDockerHostPorts(
    {
      ...machinePorts,
      WEB_HOST_PORT: '12136',
      REDIS_HOST_PORT: '3000',
    },
    { allowMachineOverride: true },
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /duplicates API_HOST_PORT/u);
  assert.match(result.errors.join('\n'), /reserved host port/u);
});
