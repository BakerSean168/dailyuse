/**
 * Story 11.5: 鏍囩缁熻涓庤繃婊?
 * 
 * 鏍囩搴旂敤鏈嶅姟 - 鎻愪緵鏍囩缁熻鍔熻兘
 * 鏍囧噯 Express/TypeScript 妯″紡 - 绉婚櫎浜?NestJS @Injectable 瑁呴グ鍣?
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, TagStatisticsDto } from '@dailyuse/contracts/repository';

export class TagsApplicationService {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  /**
   * GetRepository鐨勬爣绛剧粺璁′俊鎭?
   * AC #1: Tag 缁熻 API
   * 
   * @param repositoryUuid Repository UUID
   * @returns 鏍囩缁熻List锛堟寜浣跨敤棰戠巼闄嶅簭锛?
   */
  async getTagStatistics(repositoryUuid: string): Promise<TagStatisticsDto[]> {
    // 1. 鍔犺浇RepositoryAll鏈夎祫婧愶紙浠?MARKDOWN/TEXT 绫诲瀷锛?
    const resources = await this.resourceRepository.findByRepositoryUuid(repositoryUuid);
    
    // 杩囨护鍑烘枃鏈被鍨嬫枃浠?
    const textTypes = ['MARKDOWN', 'TEXT', 'MD', 'TXT'];
    const textResources = resources.filter(resource => {
      const persistence = (resource as any).persistence;
      return textTypes.includes(String(persistence?.type).toUpperCase());
    });

    // 2. 鑱氬悎 tag 缁熻
    const tagMap = new Map<string, TagStatisticsDto>();

    for (const resource of textResources) {
      // 鎻愬彇Resource鐨?tags
      const tags = this.extractTags(resource);

      for (const tag of tags) {
        // 鍒濆鍖?tag 缁熻
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            tag,
            count: 0,
            resources: [],
          });
        }

        // Update缁熻
        const stat = tagMap.get(tag)!;
        stat.count++;
        
        // 澶勭悊 updatedAt锛堝彲鑳芥槸鏃堕棿鎴虫垨 Date 瀵硅薄锛?
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

    // 3. 鎸変娇鐢ㄩ鐜囬檷搴忔帓搴?
    const statistics = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);

    return statistics;
  }

  /**
   * 浠庤祫婧愪腑鎻愬彇 tags
   * 澶嶇敤 Story 11.6 鐨?YAML frontmatter 瑙ｆ瀽閫昏緫
   * 
   * @param resource Resource瀵硅薄
   * @returns 鏍囩鏁扮粍
   */
  private extractTags(resource: any): string[] {
    const content = (resource as any).persistence?.content;
    if (!content) return [];

    // 1. 鎻愬彇 YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatterText = frontmatterMatch[1];

    // 2. 瑙ｆ瀽 tags 瀛楁锛堢畝鍗曠殑閫愯瑙ｆ瀽锛?
    const lines = frontmatterText.split('\n');
    let inTagsArray = false;
    const tags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 璺宠繃绌鸿鍜屾敞閲?
      if (!line || line.startsWith('#')) continue;

      // 妫€鏌ユ槸鍚︽槸 tags 灞炴€?
      if (line.toLowerCase().startsWith('tags:')) {
        const valueText = line.substring(5).trim();

        // 鍗曡鏁扮粍鏍煎紡锛歵ags: [a, b, c]
        if (valueText.startsWith('[') && valueText.endsWith(']')) {
          const arrayContent = valueText.slice(1, -1);
          const items = arrayContent.split(',').map((item: string) => item.trim());
          tags.push(...items);
          break; // 宸插鐞嗗畬姣?
        }
        // 绌哄€兼垨澶氳鏁扮粍寮€濮?
        else if (valueText === '' || valueText === '[') {
          inTagsArray = true;
          continue;
        }
        // 鍗曚釜鍊硷細tags: ddd
        else {
          tags.push(valueText);
          break;
        }
      }

      // 澶氳鏁扮粍鍏冪礌
      if (inTagsArray && line.startsWith('-')) {
        const tagValue = line.substring(1).trim();
        if (tagValue) {
          tags.push(tagValue);
        }
      }

      // 澶氳鏁扮粍缁撴潫锛堥亣鍒颁笅涓€涓睘鎬э級
      if (inTagsArray && line.includes(':') && !line.startsWith('-')) {
        break;
      }
    }

    return tags.filter(tag => tag.length > 0);
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



