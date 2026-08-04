export const OracleState = Object.freeze({
  SUCCESS: 'success',
  SKIPPED: 'skipped',
  FAILURE: 'failure',
  CANCELLED: 'cancelled',
  DETECTOR_FAILURE: 'detector-failure',
});

export function evaluateOracle({ detector = 'success', enabled = [], children = {} }) {
  if (detector !== 'success')
    return { state: OracleState.DETECTOR_FAILURE, failures: [`detector:${detector}`] };
  const failures = [];
  for (const [name, result] of Object.entries(children)) {
    const shouldRun = Array.isArray(enabled)
      ? enabled.includes(name)
      : enabled[name] === true || enabled[name] === 'true';
    if (shouldRun && result !== 'success') failures.push(`${name}:${result}`);
    if (!shouldRun && result !== 'skipped') failures.push(`${name}:unexpected-${result}`);
  }
  return { state: failures.length ? OracleState.FAILURE : OracleState.SUCCESS, failures };
}
