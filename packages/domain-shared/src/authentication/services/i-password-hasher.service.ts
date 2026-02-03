export interface IPasswordHasher {
  /**
   * 将明文加密为 Hash
   */
  hash(plain: string): Promise<string>;

  /**
   * 比对明文和 Hash 是否匹配
   */
  compare(plain: string, hashed: string): Promise<boolean>;
}