/**
 * Tags Service
 *
 * 鏍囩缁熻涓庤繃婊ゆ湇鍔?
 */

import type { IResourceRepository } from '@/domain-server';
import type { TagStatisticsDto } from '@dailyuse/contracts/repository';

/**
 * Tags Service
 */
export class TagsService {

  constructor(private readonly resourceRepository: IResourceRepository) {}


  /**
   * GetRepository鐨勬爣绛剧粺璁′俊鎭?
   *
   * @param repositoryUuid Repository UUID
   * @returns 鏍囩缁熻List锛堟寜浣跨敤棰戠巼闄嶅簭锛?
   */
  async getTagStatistics(repositoryUuid: string): Promise<TagStatisticsDto[]> {
    const resources = await this.resourceRepository.findByRepositoryUuid(repositoryUuid);

    const textTypes = ['MARKDOWN', 'TEXT', 'MD', 'TXT'];
    const textResources = resources.filter((resource) => {
      const persistence = (resource as any).persistence;
      return textTypes.includes(String(persistence?.type).toUpperCase());
    });

    const tagMap = new Map<string, TagStatisticsDto>();

    for (const resource of textResources) {
      const tags = this.extractTags(resource);

      for (const tag of tags) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            tag,
            count: 0,
            resources: [],
          });
        }

        const stat = tagMap.get(tag)!;
        stat.count++;

        const updatedAtISO =
          typeof resource.updatedAt === 'number'
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

    const statistics = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);

    return statistics;
  }

  /**
   * 浠庤祫婧愪腑鎻愬彇 tags
   */
  private extractTags(resource: any): string[] {
    const content = (resource as any).persistence?.content;
    if (!content) return [];

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatterText = frontmatterMatch[1];
    const lines = frontmatterText.split('\n');
    let inTagsArray = false;
    const tags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line || line.startsWith('#')) continue;

      if (line.toLowerCase().startsWith('tags:')) {
        const valueText = line.substring(5).trim();

        if (valueText.startsWith('[') && valueText.endsWith(']')) {
          const arrayContent = valueText.slice(1, -1);
          const items = arrayContent.split(',').map((item: string) => item.trim());
          tags.push(...items);
          break;
        } else if (valueText === '' || valueText === '[') {
          inTagsArray = true;
          continue;
        } else {
          tags.push(valueText);
          break;
        }
      }

      if (inTagsArray && line.startsWith('-')) {
        const tagValue = line.substring(1).trim();
        if (tagValue) {
          tags.push(tagValue);
        }
      }

      if (inTagsArray && line.includes(':') && !line.startsWith('-')) {
        break;
      }
    }

    return tags.filter((tag) => tag.length > 0);
  }

  /**
   * 鎻愬彇Resource鏍囬
   */
  private extractTitle(resource: any): string {
    const metadata = (resource as any).metadata;
    return metadata?.name || resource.uuid;
  }

  /**
   * 鎻愬彇Resource璺緞
   */
  private extractPath(resource: any): string {
    const metadata = (resource as any).metadata;
    return metadata?.path || '/';
  }
}

// ===== 渚挎嵎鍑芥暟 =====

export const createTagsService = (resourceRepository: IResourceRepository) =>
  new TagsService(resourceRepository);

