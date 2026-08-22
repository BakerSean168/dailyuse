import assert from 'node:assert/strict';
import {
  getRuntimeProfile,
  resolveLocalDockerHostPorts,
} from './load-profiles.mjs';

const local = getRuntimeProfile('local-docker');
assert.equal(local.ports.api, 53080);

const resolved = resolveLocalDockerHostPorts({
  API_HOST_PORT: '3000',
  WEB_HOST_PORT: '8080',
  POWERSYNC_HOST_PORT: '8081',
  POSTGRES_HOST_PORT: '5432',
  REDIS_HOST_PORT: '6379',
});

assert.equal(resolved.ok, true);
assert.equal(resolved.forced.API_HOST_PORT, '53080');
assert.equal(resolved.forced.WEB_HOST_PORT, '58080');
assert.equal(resolved.forced.POWERSYNC_HOST_PORT, '58081');
assert.equal(resolved.forced.POSTGRES_HOST_PORT, '55432');
assert.equal(resolved.forced.REDIS_HOST_PORT, '56379');
assert.ok(resolved.warnings.length >= 5);

console.log('tools/runtime self-check OK');
