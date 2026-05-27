/**
 * Desktop Repository Search Adapter
 *
 * Implements repository resource search for the editor module.
 * Extracted from main.ts to keep the composition root thin.
 *
 * @module desktop/repository/desktop-repository-search.adapter
 */

import type { SearchResponse as RepositorySearchResponse } from '@dailyuse/contracts/repository';
import type { PowerSyncDatabase } from '@powersync/node';
import { createRepositoryPowerSyncModule } from '@dailyuse/repository';

type RepositorySearchItem = RepositorySearchResponse['results'][number];

export function createDesktopRepositorySearchAdapter(
  db: PowerSyncDatabase,
  repositoryStorageDir: string,
) {
  const editorRepositoryModule = createRepositoryPowerSyncModule(db, {
    storagePort: { getBasePath: () => repositoryStorageDir } as any,
  });

  return {
    editorRepositoryModule,

    async search(
      repositoryId: string,
      query: string,
      caseSensitive = false,
    ): Promise<RepositorySearchResponse> {
      const startedAt = Date.now();
      const resources =
        await editorRepositoryModule.resourceRepository.findByRepositoryId(repositoryId);
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
              : 'content') as RepositorySearchItem['matchType'],
            matches,
            matchCount: matches.length,
            createdAt: new Date(dto.createdAt).toISOString(),
            updatedAt: new Date(dto.updatedAt).toISOString(),
            size: dto.size,
          };
        })
        .filter((item: RepositorySearchItem | null): item is RepositorySearchItem => item !== null);

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
    },
  };
}
