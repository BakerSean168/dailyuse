/**
 * 资源语言（格式）枚举
 */
export const ResourceLanguage = {
  Markdown: 'Markdown',
  Plaintext: 'Plaintext',
  Html: 'Html',
  Json: 'Json',
  Typescript: 'Typescript',
  Javascript: 'Javascript',
  Python: 'Python',
  Java: 'Java',
  Go: 'Go',
  Rust: 'Rust',
  Other: 'Other',
} as const;

export type ResourceLanguage = (typeof ResourceLanguage)[keyof typeof ResourceLanguage];
