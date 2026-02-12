import { ValueObject } from '@dailyuse/utils';
import type { HashedPasswordDTO, HashedPasswordPersistenceDTO, HashedPassword as IHashedPassword } from '@dailyuse/contracts/authentication';
import { PasswordAlgorithm } from './password-algorithm';
import { PlainPassword } from './plain-password';
import type { IPasswordHasher } from '../services/i-password-hasher.service';
/**
 * 🔐 哈希密码值对�?
 *
 * ⚠️ 安全说明�?
 * - 此对象仅�?Server 端存�?
 * - 包含敏感数据（哈希值和盐值），不应传输到客户�?
 * - 用于密码验证时的比对
 * - 绝对不能被客户端看到或修�?
 *
 * 责任�?
 * - 存储哈希后的密码和盐�?
 * - 提供密码相关的业务逻辑
 * - 不可变性：所有修改操作都返回新实�?
 */
export class HashedPassword extends ValueObject<HashedPasswordDTO> implements IHashedPassword {

  private constructor(props: HashedPasswordDTO) {
    super(props);
  }

  /**
   * 🏭 异步工厂：从原始密码创建 (Raw -> Hashed)
   * 这里是唯一发生加密计算的地�?
   */
  public static async create(rawPassword: PlainPassword, hasher: IPasswordHasher): Promise<HashedPassword> {
    // 1. 执行耗时的哈希算�?
    const hashString = await hasher.hash(rawPassword.value);
    
    // 2. �?PHC 格式哈希中提取盐�?
    // 格式: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
    const parts = hashString.split('$');
    if (parts.length < 6) {
      throw new Error('Invalid argon2 hash format');
    }
    const salt = parts[4]; // base64 编码的盐
    
    // 3. 返回包装好的值对�?
    return new HashedPassword({
      hash: hashString,
      salt,
      algorithm: PasswordAlgorithm.ARGON2, // 使用 ARGON2 算法
      createdAt: Date.now()
    });
  }

  // ================= 工厂方法 2: �?DTO 恢复 =================
  /**
   * �?DTO 恢复哈希密码对象
   */
  public static fromDTO(dto: HashedPasswordDTO): HashedPassword {
    return new HashedPassword(dto);
  }

  public static fromPersistence(dto: HashedPasswordPersistenceDTO): HashedPassword {
    return new HashedPassword({
      hash: dto.hash,
      salt: dto.salt,
      algorithm: dto.algorithm,
      createdAt: dto.createdAt.getTime()
    });
  }

  // ================= 工厂方法 3: 创建默认�?=================
  /**
   * 创建一个占位符哈希密码（用于从不设置过密码的账户）
   * 这样的密码永远不会匹配任何输�?
   */
  public static createPlaceholder(): HashedPassword {
    return new HashedPassword({
      hash: '',
      salt: '',
      algorithm: PasswordAlgorithm.ARGON2,
      createdAt: Date.now()
    });
  }

  // ================= Getters =================
  public get hash(): string {
    return this.props.hash;
  }

  public get salt(): string {
    return this.props.salt;
  }

  public get algorithm(): typeof this.props.algorithm {
    return this.props.algorithm;
  }

  public get createdAt(): number {
    return this.props.createdAt;
  }

  

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: HashedPasswordDTO): void {
    // 哈希值不能为�?
    if (!props.hash || props.hash.trim().length === 0) {
      throw new Error('Hash value cannot be empty');
    }

    // 盐值不能为�?
    if (!props.salt || props.salt.trim().length === 0) {
      throw new Error('Salt value cannot be empty');
    }

    // 算法必须是已知的
    if (!PasswordAlgorithm.isValid(props.algorithm)) {
      throw new Error(`Unknown password algorithm: ${props.algorithm}`);
    }

    // 创建时间戳必须是有效�?
    if (!Number.isFinite(props.createdAt) || props.createdAt < 0) {
      throw new Error('Invalid creation timestamp');
    }

    // 创建时间不能在未来太远（允许一些时钟偏差）
    const MAX_CLOCK_SKEW = 60000; // 1 分钟
    if (props.createdAt > Date.now() + MAX_CLOCK_SKEW) {
      throw new Error('Creation timestamp is in the future');
    }
  }

  // ================= 计算属�?=================

  /**
   * 获取哈希使用的算�?
   */
  public getAlgorithm(): typeof this.props.algorithm {
    return this.props.algorithm;
  }

  /**
   * 密码是否使用的是现代算法
   */
  public usesModernAlgorithm(): boolean {
    return PasswordAlgorithm.isSecure(PasswordAlgorithm.of(this.props.algorithm));
  }

  /**
   * 密码是否使用的是已过时的算法（应该迁移）
   */
  public usesDeprecatedAlgorithm(): boolean {
    return PasswordAlgorithm.isDeprecated(PasswordAlgorithm.of(this.props.algorithm));
  }

  /**
   * 获取密码创建距今的天�?
   */
  public getDaysSinceCreation(): number {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - this.props.createdAt) / dayMs);
  }

  /**
   * 密码是否需要重置（例如超过 90 天）
   * 可以根据业务规则调整天数阈�?
   */
  public needsReset(maxAgeDays: number = 90): boolean {
    return this.getDaysSinceCreation() > maxAgeDays;
  }

  // ================= 行为方法 =================

  /**
   * 更新密码为新的哈希�?
   * 场景：用户修改密�?
   * @throws 当新哈希值不合法�?
   */
  public updateHash(newHash: string, newSalt: string, algorithm: typeof this.props.algorithm): HashedPassword {
    HashedPassword.validate({
      hash: newHash,
      salt: newSalt,
      algorithm,
      createdAt: Date.now()
    });

    return new HashedPassword({
      hash: newHash,
      salt: newSalt,
      algorithm,
      createdAt: Date.now()
    });
  }

  /**
   * 是否应该进行算法迁移
   * 从旧算法（如 PBKDF2）迁移到新算法（�?Argon2�?
   */
  public shouldMigrateAlgorithm(): boolean {
    return this.usesDeprecatedAlgorithm();
  }

  // ================= 序列�? API / Client =================
  /**
   * ⚠️ 转换�?DTO
   * 
   * 警告：此方法返回�?DTO 包含敏感信息
   * 绝对不能发送到客户端！
   * 仅供 Server 端内部使�?
   */
  public toDTO(): HashedPasswordDTO {
    return { ...this.props };
  }

  // ================= 序列�? Persistence =================
  /**
   * 转换为持久化格式（数据库存储�?
   * 
   * �?DTO 中的 number 类型 timestamp 转换�?Date 对象
   * 用于 ORM 映射
   */
  public toPersistence(): HashedPasswordPersistenceDTO {
    return {
      hash: this.props.hash,
      salt: this.props.salt,
      algorithm: this.props.algorithm,
      createdAt: new Date(this.props.createdAt)
    };
  }
}
