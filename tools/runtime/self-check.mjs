import assert from 'node:assert/strict';
import {
  getRuntimeProfile,
  resolveLocalDockerHostPorts,
} from './load-profiles.mjs';

const local = getRuntimeProfile('local-docker');
assert.equal(local.ports.api, 20201);

const resolved = resolveLocalDockerHostPorts({
  API_HOST_PORT: '3000',
  WEB_HOST_PORT: '8080',
  POWERSYNC_HOST_PORT: '8081',
  POSTGRES_HOST_PORT: '5432',
  REDIS_HOST_PORT: '6379',
});

assert.equal(resolved.ok, true);
assert.equal(resolved.forced.API_HOST_PORT, '20201');
assert.equal(resolved.forced.WEB_HOST_PORT, '20200');
assert.equal(resolved.forced.POWERSYNC_HOST_PORT, '20202');
assert.equal(resolved.forced.POSTGRES_HOST_PORT, '20210');
assert.equal(resolved.forced.REDIS_HOST_PORT, '20211');
assert.ok(resolved.warnings.length >= 5);

console.log('tools/runtime self-check OK');
