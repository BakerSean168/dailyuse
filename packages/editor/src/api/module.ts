/**
 * Editor API Module Definition
 * 编辑器 API 模块定义
 *
 * Thin API module following the governance canonical pattern:
 * 遵循治理模块规范模式的薄 API 模块：
 *
 * 1. Composition Root — assemble dependencies via createEditorModule()
 *    组合根 — 通过 createEditorModule() 组装依赖
 * 2. Route registration — mount routes to Express router
 *    路由注册 — 将路由挂载到 Express 路由器
 *
 * All business logic lives in the composition root (editor.module.ts).
 * This file is pure plumbing.
 *
 * 所有业务逻辑都在组合根（editor.module.ts）中。
 * 此文件只是纯粹的管道连接。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import { ResultErrorException, unwrapOrThrowError } from '@dailyuse/contracts/result';
import type { SearchResponse as RepositorySearchResponse } from '@dailyuse/contracts/repository';
import { createRepositoryPrismaModule, resolveRepositoryStorageBaseDir } from '@dailyuse/repository';
import {
  createEditorModule,
  EditorWorkspacePrismaRepository,
  EditorSessionPrismaRepository,
  EditorGroupPrismaRepository,
  EditorTabPrismaRepository,
  type EditorModuleInstance,
} from '../server/infrastructure';
import { registerEditorRoutes } from './routes';
import { createEditorRuntimeContribution } from '../server/infrastructure/runtime';

// ---------------------------------------------------------------------------
// Module context — 模块注册上下文
// ---------------------------------------------------------------------------

/**
 * Typed module context for editor registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type EditorApiModuleContext = ServerModuleContext<PrismaClient>;

export interface EditorApiModuleDef {
  readonly name: string;
  register(context: EditorApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export interface CreateEditorApiModuleOptions {
  readonly repositoryStorageBaseDir?: string;
}

// ---------------------------------------------------------------------------
// Module singleton — 模块单例
// ---------------------------------------------------------------------------

let activeEditorModule: EditorModuleInstance | null = null;
let activeRepositoryBridgeModule: ReturnType<typeof createRepositoryPrismaModule> | null = null;

type RepositorySearchItem = RepositorySearchResponse['results'][number];

// ---------------------------------------------------------------------------
// API Module — API 模块
// ---------------------------------------------------------------------------

export function createEditorApiModule(
  options: CreateEditorApiModuleOptions = {},
): EditorApiModuleDef {
  return {
    name: 'Editor',

    register(context) {
      const { router, middleware, db } = context;

      // 1. Composition Root — assemble dependencies (uses shared database singleton)
      //    组合根 — 组装依赖（使用共享数据库单例）
      const prismaClient = db;
      const repositoryStorageBaseDir = resolveRepositoryStorageBaseDir({
        storageBaseDir: options.repositoryStorageBaseDir,
      });
      const repositoryBridgeModule = createRepositoryPrismaModule(prismaClient, {
        storageBaseDir: repositoryStorageBaseDir,
      });
      activeRepositoryBridgeModule = repositoryBridgeModule;
      repositoryBridgeModule.start();

      const searchRepositoryResources = async (
        workspaceId: string,
        query: string,
        caseSensitive = false,
      ): Promise<RepositorySearchResponse> => {
        const startedAt = Date.now();
        const resources =
          await repositoryBridgeModule.resourceRepository.findByRepositoryId(workspaceId);
        const normalizedQuery = caseSensitive ? query : query.toLowerCase();

        const results = resources
          .map((resource): RepositorySearchItem | null => {
            const dto = resource.toClientDTO();
            const haystacks = [dto.name, dto.path, dto.content ?? ''];
            const matches = haystacks.flatMap((value, index) => {
              const source = caseSensitive ? value : value.toLowerCase();
              const matchIndex = source.indexOf(normalizedQuery);
              if (matchIndex < 0) {
                return [];
              }

              return [
                {
                  lineNumber: index + 1,
                  lineContent: value,
                  startIndex: matchIndex,
                  endIndex: matchIndex + query.length,
                },
              ];
            });

            if (matches.length === 0) {
              return null;
            }

            return {
              resourceId: dto.id,
              resourceName: dto.name,
              resourcePath: dto.path,
              resourceType: dto.type,
              matchType: (dto.name.toLowerCase().includes(normalizedQuery.toLowerCase())
                ? 'filename'
                : 'content') as RepositorySearchResponse['results'][number]['matchType'],
              matches,
              matchCount: matches.length,
              createdAt: new Date(dto.createdAt).toISOString(),
              updatedAt: new Date(dto.updatedAt).toISOString(),
              size: dto.size,
            };
          })
          .filter(
            (item: RepositorySearchItem | null): item is RepositorySearchItem => item !== null,
          );

        return {
          results,
          totalResults: results.length,
          totalMatches: results.reduce(
            (sum: number, item: RepositorySearchItem) => sum + item.matchCount,
            0,
          ),
          searchTime: Date.now() - startedAt,
          query,
          mode: 'all',
        };
      };

      const editorModule = createEditorModule({
        workspaceRepository: new EditorWorkspacePrismaRepository(prismaClient),
        sessionRepository: new EditorSessionPrismaRepository(prismaClient),
        groupRepository: new EditorGroupPrismaRepository(prismaClient),
        tabRepository: new EditorTabPrismaRepository(prismaClient),
        repositoryContentPort: {
          async getContent(resourceId) {
            const result = await repositoryBridgeModule.api.getResource(resourceId);
            const resource = unwrapOrThrowError(result) as {
              id: string;
              name: string;
              content: string | null;
            } | null;
            if (!resource) {
              throw new ResultErrorException(
                `Repository resource not found: ${resourceId}`,
                'NOT_FOUND',
              );
            }

            return {
              resourceId: resource.id,
              name: resource.name,
              content: resource.content,
            };
          },
          async saveContent({ resourceId, content }) {
            const result = await repositoryBridgeModule.api.updateResource(resourceId, { content });
            unwrapOrThrowError(result);
          },
        },
        repositorySearchPort: {
          async search(request) {
            if (!request.workspaceId) {
              return { results: [], total: 0 };
            }

            const repositorySearch = await searchRepositoryResources(
              request.workspaceId,
              request.query,
            );

            return {
              results: repositorySearch.results
                .slice(request.offset ?? 0, (request.offset ?? 0) + (request.limit ?? 20))
                .map((item) => ({
                  resourceId: item.resourceId,
                  resourcePath: item.resourcePath,
                  resourceName: item.resourceName,
                  snippet: item.matches[0]?.lineContent ?? '',
                  score: item.matchCount,
                  highlights: item.matches.map((match) => ({
                    line: match.lineNumber,
                    text: match.lineContent,
                  })),
                })),
              total: repositorySearch.totalResults,
            };
          },
        },
        runtimeContributions: createEditorRuntimeContribution(),
      });
      activeEditorModule = editorModule;
      editorModule.start();

      // 2. Route registration — mount routes (module decides its own prefix)
      //    路由注册 — 挂载路由（模块自决前缀）
      const editorRoutes = registerEditorRoutes(
        editorModule.api,
        middleware,
        context.openApiRegistry,
      );
      router.use('/editor', editorRoutes);
    },

    destroy() {
      activeEditorModule?.dispose();
      activeEditorModule = null;
      activeRepositoryBridgeModule?.dispose();
      activeRepositoryBridgeModule = null;
    },
  };
}

export const EditorApiModule: EditorApiModuleDef = createEditorApiModule();
