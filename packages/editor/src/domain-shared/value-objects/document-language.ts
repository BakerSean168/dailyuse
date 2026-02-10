import type { DocumentLanguage as IDocumentLanguage } from '@dailyuse/contracts/editor';

/**
 * DocumentLanguage 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type DocumentLanguage = IDocumentLanguage & { readonly __brand: unique symbol };

const VALUES: IDocumentLanguage[] = [
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

export const DocumentLanguage = {
  Markdown: 'Markdown' as DocumentLanguage,
  Plaintext: 'Plaintext' as DocumentLanguage,
  Html: 'Html' as DocumentLanguage,
  Json: 'Json' as DocumentLanguage,
  Typescript: 'Typescript' as DocumentLanguage,
  Javascript: 'Javascript' as DocumentLanguage,
  Python: 'Python' as DocumentLanguage,
  Java: 'Java' as DocumentLanguage,
  Go: 'Go' as DocumentLanguage,
  Rust: 'Rust' as DocumentLanguage,
  Other: 'Other' as DocumentLanguage,

  of(value: string): DocumentLanguage {
    if (!this.isValid(value)) {
      throw new Error(`Invalid DocumentLanguage: ${value}`);
    }
    return value as DocumentLanguage;
  },

  isValid(value: string): value is DocumentLanguage {
    return VALUES.includes(value as IDocumentLanguage);
  },

  getAll(): DocumentLanguage[] {
    return VALUES as DocumentLanguage[];
  },

  isMarkdown(lang: DocumentLanguage): boolean {
    return lang === this.Markdown;
  },

  isCode(lang: DocumentLanguage): boolean {
    const codeLanguages: DocumentLanguage[] = [
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
