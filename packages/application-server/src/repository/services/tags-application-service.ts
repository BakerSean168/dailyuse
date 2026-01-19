/**
 * Story 11.5: 标签统计与过滤
 * 
 * 标签应用服务 - 提供标签统计功能
 * 标准 Express/TypeScript 模式 - 移除了 NestJS @Injectable 装饰器
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, TagStatisticsDto } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';


export class TagsApplicationService {
  private static instance: TagsApplicationService | null = null;

  constructor(private readonly resourceRepository: IResourceRepository) {}

  /**
   * 获取单例实例
   */
  static getInstance(): TagsApplicationService {
    if (!TagsApplicationService.instance) {
      const container = RepositoryContainer.getInstance();
      const resourceRepository = container.getResourceRepository();
      TagsApplicationService.instance = new TagsApplicationService(resourceRepository);
    }
    return TagsApplicationService.instance;
  }

  /**
   * 获取仓储的标签统计信息
   * AC #1: Tag 统计 API
   * 
   * @param repositoryUuid 仓储 UUID
   * @returns 标签统计列表（按使用频率降序）
   */
  async getTagStatistics(repositoryUuid: string): Promise<TagStatisticsDto[]> {
    // 1. 加载仓储所有资源（仅 MARKDOWN/TEXT 类型）
    const resources = await this.resourceRepository.findByRepositoryUuid(repositoryUuid);
    
    // 过滤出文本类型文件
    const textTypes = ['MARKDOWN', 'TEXT', 'MD', 'TXT'];
    const textResources = resources.filter(resource => {
      const persistence = (resource as any).persistence;
      return textTypes.includes(String(persistence?.type).toUpperCase());
    });

    // 2. 聚合 tag 统计
    const tagMap = new Map<string, TagStatisticsDto>();

    for (const resource of textResources) {
      // 提取资源的 tags
      const tags = this.extractTags(resource);

      for (const tag of tags) {
        // 初始化 tag 统计
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            tag,
            count: 0,
            resources: [],
          });
        }

        // 更新统计
        const stat = tagMap.get(tag)!;
        stat.count++;
        
        // 处理 updatedAt（可能是时间戳或 Date 对象）
        const updatedAtISO = typeof resource.updatedAt === 'number'
          ? new Date(resource.updatedAt).toISOString()
          : new Date().toISOString();
        
        stat.resources.push({
          uuid: resource.uuid,
          title: this.extractTitle(resource),
          path: this.extractPath(resource),
          updatedAt: updatedAtISO,
        });
      }
    }

    // 3. 按使用频率降序排序
    const statistics = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);

    return statistics;
  }

  /**
   * 从资源中提取 tags
   * 复用 Story 11.6 的 YAML frontmatter 解析逻辑
   * 
   * @param resource 资源对象
   * @returns 标签数组
   */
  private extractTags(resource: any): string[] {
    const content = (resource as any).persistence?.content;
    if (!content) return [];

    // 1. 提取 YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatterText = frontmatterMatch[1];

    // 2. 解析 tags 字段（简单的逐行解析）
    const lines = frontmatterText.split('\n');
    let inTagsArray = false;
    const tags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 跳过空行和注释
      if (!line || line.startsWith('#')) continue;

      // 检查是否是 tags 属性
      if (line.toLowerCase().startsWith('tags:')) {
        const valueText = line.substring(5).trim();

        // 单行数组格式：tags: [a, b, c]
        if (valueText.startsWith('[') && valueText.endsWith(']')) {
          const arrayContent = valueText.slice(1, -1);
          const items = arrayContent.split(',').map((item: string) => item.trim());
          tags.push(...items);
          break; // 已处理完毕
        }
        // 空值或多行数组开始
        else if (valueText === '' || valueText === '[') {
          inTagsArray = true;
          continue;
        }
        // 单个值：tags: ddd
        else {
          tags.push(valueText);
          break;
        }
      }

      // 多行数组元素
      if (inTagsArray && line.startsWith('-')) {
        const tagValue = line.substring(1).trim();
        if (tagValue) {
          tags.push(tagValue);
        }
      }

      // 多行数组结束（遇到下一个属性）
      if (inTagsArray && line.includes(':') && !line.startsWith('-')) {
        break;
      }
    }

    return tags.filter(tag => tag.length > 0);
  }

  /**
   * 提取资源标题
   */
  private extractTitle(resource: any): string {
    const metadata = (resource as any).metadata;
    return metadata?.name || resource.uuid;
  }

  /**
   * 提取资源路径
   */
  private extractPath(resource: any): string {
    const metadata = (resource as any).metadata;
    return metadata?.path || '/';
  }
}


