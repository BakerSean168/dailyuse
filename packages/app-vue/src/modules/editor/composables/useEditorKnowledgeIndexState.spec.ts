/** @vitest-environment happy-dom */

import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { AI_SERVICE_KEY } from '../../../di/keys';
import { useEditorKnowledgeIndexState } from './useEditorKnowledgeIndexState';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('useEditorKnowledgeIndexState', () => {
  it('reports pending and then searchable for the exact persisted resource', async () => {
    const result = deferred<{
      indexedCount: number;
      reusedCount: number;
      failedCount: number;
      results: Array<{
        resourceId: string;
        resourcePath: string;
        status: 'indexed' | 'reused' | 'failed';
      }>;
    }>();
    const reindexKnowledge = vi.fn(() => result.promise);
    const component = defineComponent({
      setup() {
        const resourceId = ref<string | null>('resource-1');
        const savedContent = ref('# Saved note');
        const index = useEditorKnowledgeIndexState(resourceId, savedContent);
        return { index };
      },
      template: '<span data-testid="state">{{ index.state }}</span>',
    });
    const wrapper = mount(component, {
      global: {
        provide: {
          [AI_SERVICE_KEY as symbol]: { reindexKnowledge },
        },
      },
    });

    expect(wrapper.get('[data-testid="state"]').text()).toBe('pending');
    expect(reindexKnowledge).toHaveBeenCalledWith({
      resourceIds: ['resource-1'],
      force: false,
    });

    result.resolve({
      indexedCount: 1,
      reusedCount: 0,
      failedCount: 0,
      results: [
        {
          resourceId: 'resource-1',
          resourcePath: 'notes/saved-note.md',
          status: 'indexed',
        },
      ],
    });
    await result.promise;
    await nextTick();

    expect(wrapper.get('[data-testid="state"]').text()).toBe('indexed');
  });

  it('keeps indexing failure distinct from Markdown persistence', async () => {
    const component = defineComponent({
      setup() {
        const index = useEditorKnowledgeIndexState(
          ref<string | null>('resource-1'),
          ref('# Saved note'),
        );
        return { index };
      },
      template:
        '<span data-testid="state">{{ index.state }}</span><span data-testid="error">{{ index.error }}</span>',
    });
    const wrapper = mount(component, {
      global: {
        provide: {
          [AI_SERVICE_KEY as symbol]: {
            reindexKnowledge: vi.fn().mockResolvedValue({
              indexedCount: 0,
              reusedCount: 0,
              failedCount: 1,
              results: [
                {
                  resourceId: 'resource-1',
                  resourcePath: 'notes/saved-note.md',
                  status: 'failed',
                  error: 'embedding provider unavailable',
                },
              ],
            }),
          },
        },
      },
    });

    await vi.waitFor(() => {
      expect(wrapper.get('[data-testid="state"]').text()).toBe('failed');
    });
    expect(wrapper.get('[data-testid="error"]').text()).toBe('embedding provider unavailable');
  });
});
