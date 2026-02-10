import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FolderHierarchyService } from '../FolderHierarchyService';
import { Folder } from '../../entities/Folder';
import type { IFolderRepository } from '../../repositories/IFolderRepository';

describe('FolderHierarchyService', () => {
  let service: FolderHierarchyService;
  let mockRepository: IFolderRepository;

  beforeEach(() => {
    service = new FolderHierarchyService();
    
    // Create mock repository
    mockRepository = {
      save: vi.fn(),
      findByUuid: vi.fn(),
      findByRepositoryUuid: vi.fn(),
      findByParentUuid: vi.fn(),
      findRootFolders: vi.fn(),
      delete: vi.fn(),
      deleteByRepositoryUuid: vi.fn(),
      exists: vi.fn(),
    } as any;
  });

  describe('detectCycle', () => {
    it('应该检测到简单的循环引用 (A → B → A)', async () => {
      const folderA = createTestFolder('folder-a', null);
      const folderB = createTestFolder('folder-b', 'folder-a');

      // Mock repository返回
      vi.mocked(mockRepository.findByUuid)
        .mockResolvedValueOnce(folderA)  // 第一次查询返回 folderA
        .mockResolvedValueOnce(null);     // folderA.parentUuid = null, 结束

      const cycleExists = await service.detectCycle('folder-b', 'folder-b', mockRepository);
      expect(cycleExists).toBe(true); // 移动到自己，立即检测到循环
    });

    it('应该检测到多层循环引用', async () => {
      const folderA = createTestFolder('folder-a', null);
      const folderB = createTestFolder('folder-b', 'folder-a');
      const folderC = createTestFolder('folder-c', 'folder-b');

      // 尝试将 folder-a 移动到 folder-c 下（会形成循环）
      vi.mocked(mockRepository.findByUuid)
        .mockResolvedValueOnce(folderC)  // 查找 folder-c
        .mockResolvedValueOnce(folderB)  // 查找 folder-b
        .mockResolvedValueOnce(folderA)  // 查找 folder-a (parent of folder-b)
        .mockResolvedValueOnce(null);    // folder-a is root

      const cycleExists = await service.detectCycle('folder-a', 'folder-c', mockRepository);
      expect(cycleExists).toBe(true);
    });

    it('应该允许正常的移动', async () => {
      const folderA = createTestFolder('folder-a', null);
      const folderB = createTestFolder('folder-b', 'folder-a');

      // 尝试将 folder-b 移动到 root (正常操作)
      vi.mocked(mockRepository.findByUuid).mockResolvedValueOnce(null);

      const cycleExists = await service.detectCycle('folder-b', null, mockRepository);
      expect(cycleExists).toBe(false);
    });

    it('应该检测超过最大深度', async () => {
      // 创建51层深的结构来测试 MAX_DEPTH (50)
      vi.mocked(mockRepository.findByUuid).mockImplementation(async (uuid) => {
        // 模拟无限深度
        return createTestFolder(uuid, `parent-${uuid}`);
      });

      const cycleExists = await service.detectCycle('folder-x', 'start', mockRepository);
      expect(cycleExists).toBe(true); // 超过最大深度
    });
  });

  describe('buildTree', () => {
    it('应该构建正确的树形结构', () => {
      const folder1 = createTestFolder('folder-1', null);
      const folder2 = createTestFolder('folder-2', 'folder-1');
      const folder3 = createTestFolder('folder-3', 'folder-2');

      const tree = service.buildTree([folder1, folder2, folder3]);

      expect(tree.length).toBe(1); // 只有一个根文件夹
      expect(tree[0].folder.uuid).toBe('folder-1');
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].folder.uuid).toBe('folder-2');
      expect(tree[0].children[0].children.length).toBe(1);
      expect(tree[0].children[0].children[0].folder.uuid).toBe('folder-3');
    });

    it('应该处理多个根文件夹', () => {
      const root1 = createTestFolder('root-1', null);
      const root2 = createTestFolder('root-2', null);
      const child1 = createTestFolder('child-1', 'root-1');

      const tree = service.buildTree([root1, root2, child1]);

      expect(tree.length).toBe(2); // 两个根文件夹
      expect(tree[0].folder.uuid).toBe('root-1');
      expect(tree[1].folder.uuid).toBe('root-2');
      expect(tree[0].children.length).toBe(1);
    });

    it('应该处理空列表', () => {
      const tree = service.buildTree([]);
      expect(tree).toEqual([]);
    });

    it('应该处理孤儿文件夹（parent 不存在）', () => {
      const orphan = createTestFolder('orphan', 'non-existent-parent');
      const tree = service.buildTree([orphan]);

      expect(tree.length).toBe(1); // 孤儿被视为根文件夹
      expect(tree[0].folder.uuid).toBe('orphan');
    });
  });

  describe('updateChildrenPaths', () => {
    it('应该级联更新所有子文件夹路径', async () => {
      const folder1 = createTestFolder('folder-1', null, '/Root');
      const folder2 = createTestFolder('folder-2', 'folder-1', '/Root/Child');
      const folder3 = createTestFolder('folder-3', 'folder-2', '/Root/Child/Grandchild');

      // Mock repository返回
      vi.mocked(mockRepository.findByParentUuid)
        .mockResolvedValueOnce([folder2])  // folder-1 的子文件夹
        .mockResolvedValueOnce([folder3])  // folder-2 的子文件夹
        .mockResolvedValueOnce([]);        // folder-3 没有子文件夹

      await service.updateChildrenPaths('folder-1', '/NewRoot', mockRepository);

      // 验证 save 被调用
      expect(mockRepository.save).toHaveBeenCalledTimes(2); // folder-2 和 folder-3
    });

    it('应该处理没有子文件夹的情况', async () => {
      vi.mocked(mockRepository.findByParentUuid).mockResolvedValueOnce([]);

      await service.updateChildrenPaths('leaf-folder', '/Path', mockRepository);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});

// Helper function to create test folders
function createTestFolder(uuid: string, parentUuid: string | null, path?: string): Folder {
  return {
    uuid,
    repositoryUuid: 'test-repo',
    name: `Folder ${uuid}`,
    path: path || `/Folder ${uuid}`,
    parentUuid,
    order: 0,
    isExpanded: true,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    updatePath: vi.fn(),
  } as any;
}
