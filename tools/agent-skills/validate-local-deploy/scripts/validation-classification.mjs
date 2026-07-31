export function classifyValidationFailure({ label, environmentIssue = false }) {
  if (environmentIssue) return 'host-tool';
  if (label === 'docker-local-up' || label === 'docker-local-rebuild') {
    return 'docker-deploy';
  }
  return 'code';
}

export function summarizeFailureClasses(commandResults, extraFailures = []) {
  const summary = {
    'host-tool': 0,
    code: 0,
    'docker-deploy': 0,
  };

  for (const result of commandResults) {
    if (result.failureClass && result.status === 'fail') {
      summary[result.failureClass] += 1;
    }
  }
  for (const failureClass of extraFailures) {
    if (failureClass in summary) summary[failureClass] += 1;
  }

  return summary;
}
