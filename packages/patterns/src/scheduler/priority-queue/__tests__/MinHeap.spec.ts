import { describe, it, expect } from 'vitest';
import { MinHeap, type HeapItem } from '../min-heap';

describe('MinHeap', () => {
  it('should create an empty heap', () => {
    const heap = new MinHeap();
    expect(heap.size).toBe(0);
    expect(heap.isEmpty).toBe(true);
    expect(heap.peek()).toBeUndefined();
  });

  it('should insert and extract min element', () => {
    const heap = new MinHeap<HeapItem>();

    heap.insert({ taskId: '1', nextRunAt: 100 });
    heap.insert({ taskId: '2', nextRunAt: 50 });
    heap.insert({ taskId: '3', nextRunAt: 150 });

    expect(heap.size).toBe(3);
    expect(heap.peek()?.taskId).toBe('2');

    const min = heap.extractMin();
    expect(min?.taskId).toBe('2');
    expect(heap.size).toBe(2);

    expect(heap.peek()?.taskId).toBe('1');
  });

  it('should remove specific element', () => {
    const heap = new MinHeap<HeapItem>();

    heap.insert({ taskId: '1', nextRunAt: 100 });
    heap.insert({ taskId: '2', nextRunAt: 50 });
    heap.insert({ taskId: '3', nextRunAt: 150 });

    const removed = heap.remove('1');
    expect(removed).toBe(true);
    expect(heap.size).toBe(2);
    expect(heap.has('1')).toBe(false);
  });

  it('should update element nextRunAt', () => {
    const heap = new MinHeap<HeapItem>();

    heap.insert({ taskId: '1', nextRunAt: 100 });
    heap.insert({ taskId: '2', nextRunAt: 50 });
    heap.insert({ taskId: '3', nextRunAt: 150 });

    heap.update('1', 25);
    expect(heap.peek()?.taskId).toBe('1');
  });

  it('should build heap from array', () => {
    const items: HeapItem[] = [
      { taskId: '1', nextRunAt: 100 },
      { taskId: '2', nextRunAt: 50 },
      { taskId: '3', nextRunAt: 150 },
      { taskId: '4', nextRunAt: 25 },
    ];

    const heap = MinHeap.fromArray(items);
    expect(heap.size).toBe(4);
    expect(heap.peek()?.taskId).toBe('4');
  });

  it('should clear heap', () => {
    const heap = new MinHeap<HeapItem>();

    heap.insert({ taskId: '1', nextRunAt: 100 });
    heap.insert({ taskId: '2', nextRunAt: 50 });

    heap.clear();
    expect(heap.size).toBe(0);
    expect(heap.isEmpty).toBe(true);
  });
});
