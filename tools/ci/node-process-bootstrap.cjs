const events = require('node:events');

const MIN_MAX_LISTENERS = 32;

if (events.defaultMaxListeners < MIN_MAX_LISTENERS) {
  events.defaultMaxListeners = MIN_MAX_LISTENERS;
}

if (
  typeof process.getMaxListeners === 'function' &&
  typeof process.setMaxListeners === 'function'
) {
  process.setMaxListeners(Math.max(process.getMaxListeners(), MIN_MAX_LISTENERS));
}
