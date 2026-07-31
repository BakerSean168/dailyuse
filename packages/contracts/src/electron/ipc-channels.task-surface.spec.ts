import { describe, expect, it } from 'vitest';
import { TaskChannels } from './ipc-channels';

/**
 * Task IPC surface (stage-6 residual):
 * Unsupported task:instance:update must stay retired from contracts.
 */
describe('TaskChannels surface', () => {
  it('does not expose retired unsupported instance update channel', () => {
    expect(TaskChannels).not.toHaveProperty('INSTANCE_UPDATE');
    expect(Object.values(TaskChannels)).not.toContain('task:instance:update');
  });

  it('keeps live template/instance/dependency channels used by Task IPC adapters', () => {
    expect(TaskChannels.TEMPLATE_LIST).toBe('task:template:list');
    expect(TaskChannels.INSTANCE_LIST).toBe('task:instance:list');
    expect(TaskChannels.INSTANCE_UNCOMPLETE).toBe('task:instance:uncomplete');
    expect(TaskChannels.DEPENDENCY_CREATE).toBe('task:dependency:create');
  });
});
