/**
 * useRepositoryTree — Tree navigation composable
 *
 * Manages file-tree loading and node refresh for the repository module.
 */

import { computed } from 'vue';
import { useRepositoryStore } from '../stores/repository-store';
import type { TreeNode } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';

interface TreeServiceLike {
  getFileTree?(repositoryId: string): Promise<Result<{ tree: TreeNode[] }>>;
}

export function useRepositoryTree(
  service: TreeServiceLike,
  executeOperation: <T>(op: () => Promise<Result<T>>, fallback: string) => Promise<Result<T>>,
) {
  const store = useRepositoryStore();
  const treeNodes = computed(() => store.treeNodes);

  async function fetchTreeNodes(): Promise<TreeNode[]> {
    if (!store.currentRepositoryId || typeof service.getFileTree !== 'function') {
      store.setTreeNodes([]);
      return [];
    }

    const repositoryId = store.currentRepositoryId;
    const result = await executeOperation(
      () => service.getFileTree!(repositoryId),
      '加载目录失败',
    );
    if (result.ok) {
      const tree = result.data?.tree ?? [];
      store.setTreeNodes(tree);
      return tree;
    }
    return store.treeNodes;
  }

  return {
    treeNodes,
    fetchTreeNodes,
  };
}
