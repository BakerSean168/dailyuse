import type { PlainPassword } from "./plain-password";

// 数据库存的哈希密码 (构造时校验 $2a$ 等前缀)
export interface HashedPassword {
  readonly value: string;
  // 核心逻辑: 比对
  match(plain: PlainPassword, verifyService: any): Promise<boolean>;
}