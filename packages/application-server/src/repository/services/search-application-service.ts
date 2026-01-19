/**
 * Search Application Service
 * Story 11.2: Obsidian 风格搜索
 * Story 11.6: 高级搜索功能（property 模式）
 */

import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, SearchRequest, SearchResponse, SearchResultItem, MatchType } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';
import { Resource } from '@dailyuse/domain-server/repository';
import type { IResourceRepository } from '@dailyuse/domain-server/repository';


export class SearchApplicationService {
  private static instance: SearchApplicationService;
  private resourceRepository: IResourceRepository;

  private constructor() {
    const container = RepositoryContainer.getInstance();
    this.resourceRepository = container.getResourceRepository();
  }

  static getInstance(): SearchApplicationService {
    if (!SearchApplicationService.instance) {
      SearchApplicationService.instance = new SearchApplicationService();
    }
    return SearchApplicationService.instance;
  }

  /**
   * 执行搜索
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const results: SearchResultItem[] = [];

    // 1. 获取所有资源
    const resources = await this.resourceRepository.findByRepositoryUuid(
      request.repositoryUuid
    );

    // 2. 根据搜索模式筛选
    for (const resource of resources) {
      const result = await this.searchResource(resource, request);
      if (result && result.matchCount > 0) {
        results.push(result);
      }
    }

    // 3. 排序（按匹配数量降序）
    results.sort((a, b) => b.matchCount - a.matchCount);

    // 4. 分页
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
   * 搜索单个资源
   */
  private async searchResource(
    resource: Resource,
    request: SearchRequest
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
      createdAt: new Date(Number(persistence.created_at)).toISOString(),
      updatedAt: new Date(Number(persistence.updated_at)).toISOString(),
      size: persistence.size,
    };

    // 根据搜索模式执行不同的搜索逻辑
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
   * 搜索文件名
   */
  private searchInFilename(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem
  ): void {
    const persistence = resource.toPersistenceDTO();
    const searchText = request.caseSensitive
      ? persistence.name
      : persistence.name.toLowerCase();

    const query = request.caseSensitive
      ? request.query
      : request.query.toLowerCase();

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
   * 搜索标签
   */
  private searchInTags(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem
  ): void {
    const persistence = resource.toPersistenceDTO();
    const metadata = JSON.parse(persistence.metadata);
    const tags = metadata?.tags || [];
    
    const query = request.caseSensitive
      ? request.query
      : request.query.toLowerCase();

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
   * 搜索路径
   */
  private searchInPath(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem
  ): void {
    const persistence = resource.toPersistenceDTO();
    const searchText = request.caseSensitive
      ? persistence.path
      : persistence.path.toLowerCase();

    const query = request.caseSensitive
      ? request.query
      : request.query.toLowerCase();

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
   * Story 11.6: 搜索 YAML frontmatter 属性
   * 格式：[property]:value
   * 例如：[author]:sean
   */
  private searchInProperty(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem
  ): void {
    const persistence = resource.toPersistenceDTO();
    
    // 只搜索文本类型文件
    const textTypes = ['MARKDOWN', 'TEXT', 'MD', 'TXT'];
    if (!textTypes.includes(String(persistence.type).toUpperCase())) {
      return;
    }

    try {
      const content = persistence.content || '';
      
      // 解析查询：[property]:value
      const propertyQueryMatch = request.query.match(/\[([^\]]+)\]:(.+)/);
      if (!propertyQueryMatch) {
        console.warn('Invalid property query format. Expected: [property]:value');
        return;
      }

      const [, property, value] = propertyQueryMatch;
      const propertyName = property.trim();
      const searchValue = value.trim();

      // 提取 YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return; // 没有 frontmatter
      }

      try {
        // 简单的 YAML 解析（避免引入 yaml 库）
        const frontmatterText = frontmatterMatch[1];
        const lines = frontmatterText.split('\n');
        
        let currentProperty = '';
        let currentValue: string | string[] = '';
        let inArray = false;
        let arrayValues: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // 跳过空行和注释
          if (!line || line.startsWith('#')) continue;
          
          // 属性定义
          if (line.includes(':') && !line.startsWith('-')) {
            // 保存上一个属性的数组值
            if (inArray && currentProperty) {
              if (this.matchPropertyValue(currentProperty, arrayValues, propertyName, searchValue, request.caseSensitive)) {
                result.matches.push({
                  lineNumber: i,
                  lineContent: `${currentProperty}: ${JSON.stringify(arrayValues)}`,
                  startIndex: 0,
                  endIndex: line.length,
                });
                result.matchCount++;
              }
            }
            
            // 解析新属性
            const [key, ...valueParts] = line.split(':');
            currentProperty = key.trim();
            const valueText = valueParts.join(':').trim();
            
            if (valueText === '[' || valueText === '') {
              // 数组开始
              inArray = true;
              arrayValues = [];
            } else {
              // 单个值
              inArray = false;
              currentValue = valueText;
              
              // 检查匹配
              if (this.matchPropertyValue(currentProperty, currentValue, propertyName, searchValue, request.caseSensitive)) {
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
            // 数组元素
            const arrayValue = line.substring(1).trim();
            arrayValues.push(arrayValue);
          }
        }
        
        // 处理最后一个数组
        if (inArray && currentProperty) {
          if (this.matchPropertyValue(currentProperty, arrayValues, propertyName, searchValue, request.caseSensitive)) {
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
   * 匹配属性值
   */
  private matchPropertyValue(
    currentProperty: string,
    currentValue: string | string[],
    targetProperty: string,
    searchValue: string,
    caseSensitive?: boolean
  ): boolean {
    // 属性名匹配（忽略大小写）
    if (currentProperty.toLowerCase() !== targetProperty.toLowerCase()) {
      return false;
    }

    // 值匹配
    const normalizeText = (text: string) => 
      caseSensitive ? text : text.toLowerCase();

    const normalizedSearch = normalizeText(searchValue);

    if (typeof currentValue === 'string') {
      return normalizeText(currentValue).includes(normalizedSearch);
    } else if (Array.isArray(currentValue)) {
      return currentValue.some(v => 
        normalizeText(String(v)).includes(normalizedSearch)
      );
    }

    return false;
  }

  /**
   * 搜索内容
   */
  private searchInContent(
    resource: Resource,
    request: SearchRequest,
    result: SearchResultItem
  ): void {
    const persistence = resource.toPersistenceDTO();
    
    // 只搜索文本类型文件
    const textTypes = ['MARKDOWN', 'TEXT', 'MD', 'TXT'];
    if (!textTypes.includes(String(persistence.type).toUpperCase())) {
      return;
    }

    try {
      // 使用 resource 的 content 字段
      const content = persistence.content || '';
      const lines = content.split('\n');

      const query = request.caseSensitive
        ? request.query
        : request.query.toLowerCase();

      lines.forEach((line, index) => {
        const lineText = request.caseSensitive ? line : line.toLowerCase();

        // 模式过滤
        if (request.mode === 'section') {
          // 只搜索标题行 (Markdown)
          if (!line.trim().startsWith('#')) return;
        }

        // 查找匹配
        const startIndex = lineText.indexOf(query);
        if (startIndex !== -1) {
          // 获取上下文
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


