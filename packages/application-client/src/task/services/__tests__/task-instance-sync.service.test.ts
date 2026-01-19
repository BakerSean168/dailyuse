import { describe, it, expect, beforeEach } from 'vitest';
import { TaskInstanceSyncService } from '../task-instance-sync.service';

describe('TaskInstanceSyncService', () => {
  let service: TaskInstanceSyncService;

  beforeEach(() => {
    service = TaskInstanceSyncService.getInstance();
  });

  it('should create a singleton instance', () => {
    const instance1 = TaskInstanceSyncService.getInstance();
    const instance2 = TaskInstanceSyncService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should provide loadInstancesForDate method', () => {
    expect(service.loadInstancesForDate).toBeDefined();
    expect(typeof service.loadInstancesForDate).toBe('function');
  });

  it('should provide dispose method', () => {
    expect(service.dispose).toBeDefined();
    expect(typeof service.dispose).toBe('function');
  });

  it('should not error when disposing service', () => {
    expect(() => {
      service.dispose();
    }).not.toThrow();
  });
});
