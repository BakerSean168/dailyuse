/**
 * Search Application Service
 * Story 11.2: Obsidian 椋庢牸鎼滅储
 * Story 11.6: 楂樼骇鎼滅储鍔熻兘锛坧roperty 妯″紡锛?
 */

import type {
  RepositoryServerDTO,
  ResourceServerDTO,
  FolderServerDTO,
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  MatchType,
} from '@dailyuse/contracts/repository';
import { Resource } from '../../domain-server/entities/resource';
import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';

export class SearchApplicationService {
  private resourceRepository: IResourceRepository;

  constructor(resourceRepository: IResourceRepository) {
    this.resourceRepository = resourceRepository;
  }

  /**
   * 鎵ц鎼滅储
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const results: SearchResultItem[] = [];

    // 1. GetAll鏈夎祫婧?
    const resources = await this.resourceRepository.findByRepositoryUuid(request.repositoryUuid);

    // 2. 鏍规嵁鎼滅储妯″紡绛涢€?
    for (const resource of resources) {
      const result = await this.searchResource(resource, request);
      if (result && result.matchCount > 0) {
        results.push(result);
      }
    }

    // 3. 鎺掑簭锛堟寜鍖归厤鏁伴噺闄嶅簭锛?
    results.sort((a, b) => b.matchCount - a.matchCount);

    // 4. 鍒嗛〉
    const page = request.page || 1;
    const pageSize = request.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = results.slice(startIndex, startIndex + pageSize);

    const searchTime = Date.now() - startTime;
    const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);

    return {
      results: paginatedResults,
      totalResults: results.length,
      totalMatches,
      searchTime,
      query: request.query,
      mode: request.mode,
    };
  }

  /**
   * 鎼滅储鍗曚釜Resource
   */
  private async searchResource(
    resource: Resource,
    request: SearchRequest,
  ): Promise<SearchResultItem | null> {
    const persistence = resource.toPersistenceDTO();

    const searchResult: SearchResultItem = {
      resourceUuid: persistence.uuid,
      resourceName: persistence.name,
      resourcePath: persistence.path,
      resourceType: persistence.type,
      matchType: this.getMatchType(request.mode),
      matches: [],
      matchCount: 0,
      createdAt: new Date(Number(persistence.createdAt)).toISOString(),
      updatedAt: new Date(Number(persistence.updatedAt)).toISOString(),
      size: persistence.size,
    };

    // 鏍规嵁鎼滅储妯″紡鎵ц涓嶅悓鐨勬悳绱㈤€昏緫
    switch (request.mode) {
      case 'file':
        this.searchInFilename(resource, request, searchResult);
        break;

      case 'tag':
        this.searchInTags(resource, request, searchResult);
        break;

      case 'path':
        this.searchInPath(resource, request, searchResult);
        break;

      case 'property':
        // Story 11.6: YAML property search
        this.searchInProperty(resource, request, searchResult);
        break;

      case 'line':
      case 'section':
      case 'all':
        this.searchInContent(resource, request, searchResult);
        break;
    }

    return searchResult.matchCount > 0 ? searchResult : null;
  }

  /**
   * 鎼滅储鏂囦欢And
   */
  private searchInFilename(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem,
  ): void {
    const persistence = resource.toPersistenceDTO();
    const searchText = request.caseSensitive ? persistence.name : persistence.name.toLowerCase();

    const query = request.caseSensitive ? request.query : request.query.toLowerCase();

    if (searchText.includes(query)) {
      result.matches.push({
        lineNumber: 0,
        lineContent: persistence.name,
        startIndex: searchText.indexOf(query),
        endIndex: searchText.indexOf(query) + query.length,
      });
      result.matchCount = 1;
    }
  }

  /**
   * 鎼滅储鏍囩
   */
  private searchInTags(resource: Resource, request: SearchRequest, result: SearchResultItem): void {
    const persistence = resource.toPersistenceDTO();
    const metadata = JSON.parse(persistence.metadata);
    const tags = metadata?.tags || [];

    const query = request.caseSensitive ? request.query : request.query.toLowerCase();

    tags.forEach((tag: string, index: number) => {
      const tagText = request.caseSensitive ? tag : tag.toLowerCase();

      if (tagText.includes(query)) {
        result.matches.push({
          lineNumber: index + 1,
          lineContent: `#${tag}`,
          startIndex: tagText.indexOf(query),
          endIndex: tagText.indexOf(query) + query.length,
        });
        result.matchCount++;
      }
    });
  }

  /**
   * 鎼滅储璺緞
   */
  private searchInPath(resource: Resource, request: SearchRequest, result: SearchResultItem): void {
    const persistence = resource.toPersistenceDTO();
    const searchText = request.caseSensitive ? persistence.path : persistence.path.toLowerCase();

    const query = request.caseSensitive ? request.query : request.query.toLowerCase();

    if (searchText.includes(query)) {
      result.matches.push({
        lineNumber: 0,
        lineContent: persistence.path,
        startIndex: searchText.indexOf(query),
        endIndex: searchText.indexOf(query) + query.length,
      });
      result.matchCount = 1;
    }
  }

  /**
   * Story 11.6: 鎼滅储 YAML frontmatter 灞炴€?
   * 鏍煎紡锛歔property]:value
   * 渚嬪锛歔author]:sean
   */
  private searchInProperty(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem,
  ): void {
    const persistence = resource.toPersistenceDTO();

    // 鍙悳绱㈡枃鏈被鍨嬫枃浠?
    const textTypes = ['MARKDOWN', 'TEXT', 'MD', 'TXT'];
    if (!textTypes.includes(String(persistence.type).toUpperCase())) {
      return;
    }

    try {
      const content = persistence.content || '';

      // 瑙ｆ瀽鏌ヨ锛歔property]:value
      const propertyQueryMatch = request.query.match(/\[([^\]]+)\]:(.+)/);
      if (!propertyQueryMatch) {
        console.warn('Invalid property query format. Expected: [property]:value');
        return;
      }

      const [, property, value] = propertyQueryMatch;
      const propertyName = property.trim();
      const searchValue = value.trim();

      // 鎻愬彇 YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return; // 娌℃湁 frontmatter
      }

      try {
        // 绠€鍗曠殑 YAML 瑙ｆ瀽锛堥伩鍏嶅紩鍏?yaml 搴擄級
        const frontmatterText = frontmatterMatch[1];
        const lines = frontmatterText.split('\n');

        let currentProperty = '';
        let currentValue: string | string[] = '';
        let inArray = false;
        let arrayValues: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // 璺宠繃绌鸿鍜屾敞閲?
          if (!line || line.startsWith('#')) continue;

          // 灞炴€у畾涔?
          if (line.includes(':') && !line.startsWith('-')) {
            // Save涓婁竴涓睘鎬х殑鏁扮粍鍊?
            if (inArray && currentProperty) {
              if (
                this.matchPropertyValue(
                  currentProperty,
                  arrayValues,
                  propertyName,
                  searchValue,
                  request.caseSensitive,
                )
              ) {
                result.matches.push({
                  lineNumber: i,
                  lineContent: `${currentProperty}: ${JSON.stringify(arrayValues)}`,
                  startIndex: 0,
                  endIndex: line.length,
                });
                result.matchCount++;
              }
            }

            // 瑙ｆ瀽鏂板睘鎬?
            const [key, ...valueParts] = line.split(':');
            currentProperty = key.trim();
            const valueText = valueParts.join(':').trim();

            if (valueText === '[' || valueText === '') {
              // 鏁扮粍寮€濮?
              inArray = true;
              arrayValues = [];
            } else {
              // 鍗曚釜鍊?
              inArray = false;
              currentValue = valueText;

              // 妫€鏌ュ尮閰?
              if (
                this.matchPropertyValue(
                  currentProperty,
                  currentValue,
                  propertyName,
                  searchValue,
                  request.caseSensitive,
                )
              ) {
                result.matches.push({
                  lineNumber: i + 1,
                  lineContent: line,
                  startIndex: 0,
                  endIndex: line.length,
                });
                result.matchCount++;
              }
            }
          } else if (line.startsWith('-') && inArray) {
            // 鏁扮粍鍏冪礌
            const arrayValue = line.substring(1).trim();
            arrayValues.push(arrayValue);
          }
        }

        // 澶勭悊鏈€鍚庝竴涓暟缁?
        if (inArray && currentProperty) {
          if (
            this.matchPropertyValue(
              currentProperty,
              arrayValues,
              propertyName,
              searchValue,
              request.caseSensitive,
            )
          ) {
            result.matches.push({
              lineNumber: lines.length,
              lineContent: `${currentProperty}: ${JSON.stringify(arrayValues)}`,
              startIndex: 0,
              endIndex: 0,
            });
            result.matchCount++;
          }
        }
      } catch (yamlError) {
        console.error('Failed to parse YAML frontmatter:', yamlError);
      }
    } catch (error) {
      console.error(`Failed to search property in resource ${persistence.uuid}:`, error);
    }
  }

  /**
   * 鍖归厤灞炴€у€?
   */
  private matchPropertyValue(
    currentProperty: string,
    currentValue: string | string[],
    targetProperty: string,
    searchValue: string,
    caseSensitive?: boolean,
  ): boolean {
    // 灞炴€у悕鍖归厤锛堝拷鐣ュぇ灏忓啓锛?
    if (currentProperty.toLowerCase() !== targetProperty.toLowerCase()) {
      return false;
    }

    // 鍊煎尮閰?
    const normalizeText = (text: string) => (caseSensitive ? text : text.toLowerCase());

    const normalizedSearch = normalizeText(searchValue);

    if (typeof currentValue === 'string') {
      return normalizeText(currentValue).includes(normalizedSearch);
    } else if (Array.isArray(currentValue)) {
      return currentValue.some((v) => normalizeText(String(v)).includes(normalizedSearch));
    }

    return false;
  }

  /**
   * 鎼滅储鍐呭
   */
  private searchInContent(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem,
  ): void {
    const persistence = resource.toPersistenceDTO();

    // 鍙悳绱㈡枃鏈被鍨嬫枃浠?
    const textTypes = ['MARKDOWN', 'TEXT', 'MD', 'TXT'];
    if (!textTypes.includes(String(persistence.type).toUpperCase())) {
      return;
    }

    try {
      // 浣跨敤 resource 鐨?content 瀛楁
      const content = persistence.content || '';
      const lines = content.split('\n');

      const query = request.caseSensitive ? request.query : request.query.toLowerCase();

      lines.forEach((line, index) => {
        const lineText = request.caseSensitive ? line : line.toLowerCase();

        // 妯″紡杩囨护
        if (request.mode === 'section') {
          // 鍙悳绱㈡爣棰樿 (Markdown)
          if (!line.trim().startsWith('#')) return;
        }

        // 鏌ユ壘鍖归厤
        const startIndex = lineText.indexOf(query);
        if (startIndex !== -1) {
          // Get涓婁笅鏂?
          const beforeContext = lines[index - 1] || '';
          const afterContext = lines[index + 1] || '';

          result.matches.push({
            lineNumber: index + 1,
            lineContent: line,
            startIndex,
            endIndex: startIndex + query.length,
            beforeContext,
            afterContext,
          });
          result.matchCount++;
        }
      });
    } catch (error) {
      console.error(`Failed to search resource ${persistence.uuid}:`, error);
    }
  }

  private getMatchType(mode: string): MatchType {
    const typeMap: Record<string, MatchType> = {
      file: 'filename',
      tag: 'tag',
      path: 'path',
      section: 'section',
      line: 'content',
      all: 'content',
      property: 'property', // Story 11.6
    };
    return typeMap[mode] || 'content';
  }
}
