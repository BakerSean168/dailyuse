import type { IEditorWorkspaceRepository } from '@/domain-server';
import { PrismaEditorWorkspaceRepository } from '../repositories/prisma/PrismaEditorWorkspaceRepository';
import { prisma } from '../../shared/config/prisma';

/**
 * Editor Module DI Container
 * 绠＄悊 Editor 妯″潡鐨勬墍鏈変粨鍌ㄥ疄锟?
 */
export class EditorContainer {
  private static instance: EditorContainer;
  private editorWorkspaceRepository: IEditorWorkspaceRepository | null = null;

  private constructor() {}

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): EditorContainer {
    if (!EditorContainer.instance) {
      EditorContainer.instance = new EditorContainer();
    }
    return EditorContainer.instance;
  }

  /**
   * Get EditorWorkspace 鑱氬悎鏍逛粨锟?
   * 浣跨敤鎳掑姞杞斤紝绗竴娆¤闂椂Create瀹炰緥
   */
  getEditorWorkspaceRepository(): IEditorWorkspaceRepository {
    if (!this.editorWorkspaceRepository) {
      this.editorWorkspaceRepository = new PrismaEditorWorkspaceRepository(prisma);
    }
    return this.editorWorkspaceRepository;
  }

  /**
   * 璁剧疆 EditorWorkspace 鑱氬悎鏍逛粨鍌紙鐢ㄤ簬娴嬭瘯锟?
   */
  setEditorWorkspaceRepository(repository: IEditorWorkspaceRepository): void {
    this.editorWorkspaceRepository = repository;
  }
}

