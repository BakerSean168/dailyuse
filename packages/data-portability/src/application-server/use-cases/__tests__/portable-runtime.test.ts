import { describe, it, expect } from 'vitest';
import { RefAllocator } from '../../portable-runtime';

describe('RefAllocator', () => {
  it('allocates sequential refs with prefix', () => {
    const allocator = new RefAllocator();

    expect(allocator.allocate('goal')).toBe('goal:1');
    expect(allocator.allocate('goal')).toBe('goal:2');
    expect(allocator.allocate('task')).toBe('task:1');
    expect(allocator.allocate('goal')).toBe('goal:3');
  });
});
