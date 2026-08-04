export function classifyFailure({
  exitCode = 1,
  signal = null,
  timedOut = false,
  output = '',
} = {}) {
  const text = String(output);
  if (timedOut) return 'timeout';
  if (signal || /SIG(?:SEGV|ABRT|BUS)|segmentation fault|native crash/i.test(text))
    return 'process-crash';
  if (
    /startup|spawn|ENOENT|ECONNREFUSED|failed to connect|docker daemon|cannot find module/i.test(
      text,
    )
  )
    return 'infrastructure';
  if (/flaky|unstable|flake/i.test(text)) return 'flaky';
  return exitCode === 0 ? 'success' : 'assertion';
}
