import type { ResourceLanguage as IResourceLanguage } from '@dailyuse/contracts/editor';

/**
 * ResourceLanguage 枚举类型
 *
 * 【规范说明：枚举与常量对象规范】
 */

export type ResourceLanguage = IResourceLanguage & { readonly __brand: unique symbol };

const VALUES: IResourceLanguage[] = [
  'Markdown',
  'Plaintext',
  'Html',
  'Json',
  'Typescript',
  'Javascript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'Other',
];

export const ResourceLanguage = {
  Markdown: 'Markdown' as ResourceLanguage,
  Plaintext: 'Plaintext' as ResourceLanguage,
  Html: 'Html' as ResourceLanguage,
  Json: 'Json' as ResourceLanguage,
  Typescript: 'Typescript' as ResourceLanguage,
  Javascript: 'Javascript' as ResourceLanguage,
  Python: 'Python' as ResourceLanguage,
  Java: 'Java' as ResourceLanguage,
  Go: 'Go' as ResourceLanguage,
  Rust: 'Rust' as ResourceLanguage,
  Other: 'Other' as ResourceLanguage,

  of(value: string): ResourceLanguage {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ResourceLanguage: ${value}`);
    }
    return value as ResourceLanguage;
  },

  isValid(value: string): value is ResourceLanguage {
    return VALUES.includes(value as IResourceLanguage);
  },

  getAll(): ResourceLanguage[] {
    return VALUES as ResourceLanguage[];
  },

  isMarkdown(lang: ResourceLanguage): boolean {
    return lang === this.Markdown;
  },

  isCode(lang: ResourceLanguage): boolean {
    const codeLanguages: ResourceLanguage[] = [
      this.Typescript,
      this.Javascript,
      this.Python,
      this.Java,
      this.Go,
      this.Rust,
    ];
    return codeLanguages.includes(lang);
  },
};
