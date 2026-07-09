import { ProjectType as ProjectTypeContract, type ProjectType as IProjectType } from '@dailyuse/contracts/editor';

/**
 * ProjectType 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type ProjectType = IProjectType & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IProjectType[] = Object.values(ProjectTypeContract);

export const ProjectType = {
  Markdown: 'Markdown' as ProjectType,
  Code: 'Code' as ProjectType,
  Mixed: 'Mixed' as ProjectType,
  Other: 'Other' as ProjectType,

  of(value: string): ProjectType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ProjectType: ${value}`);
    }
    return value as ProjectType;
  },

  isValid(value: string): value is ProjectType {
    return VALUES.includes(value as IProjectType);
  },

  getAll(): ProjectType[] {
    return VALUES as ProjectType[];
  },

  isMarkdown(type: ProjectType): boolean {
    return type === this.Markdown;
  },

  isCode(type: ProjectType): boolean {
    return type === this.Code;
  },

  isMixed(type: ProjectType): boolean {
    return type === this.Mixed;
  },
};
