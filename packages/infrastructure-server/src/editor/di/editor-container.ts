import type { IEditorWorkspaceRepository } from '@dailyuse/domain-server/editor';
import { PrismaEditorWorkspaceRepository } from '../repositories/prisma/PrismaEditorWorkspaceRepository';
import { prisma } from '@/shared/infrastructure/config/prisma';

/**
 * Editor Module DI Container
 * 管理 Editor 模块的所有仓储实例
 */
export class EditorContainer {
  private static instance: EditorContainer;
  private editorWorkspaceRepository: IEditorWorkspaceRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): EditorContainer {
    if (!EditorContainer.instance) {
      EditorContainer.instance = new EditorContainer();
    }
    return EditorContainer.instance;
  }

  /**
   * 获取 EditorWorkspace 聚合根仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getEditorWorkspaceRepository(): IEditorWorkspaceRepository {
    if (!this.editorWorkspaceRepository) {
      this.editorWorkspaceRepository = new PrismaEditorWorkspaceRepository(prisma);
    }
    return this.editorWorkspaceRepository;
  }

  /**
   * 设置 EditorWorkspace 聚合根仓储（用于测试）
   */
  setEditorWorkspaceRepository(repository: IEditorWorkspaceRepository): void {
    this.editorWorkspaceRepository = repository;
  }
}
