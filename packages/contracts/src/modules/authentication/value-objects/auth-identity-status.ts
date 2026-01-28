export enum IdentityStatus {
  ACTIVE = 'ACTIVE',       // 正常
  LOCKED = 'LOCKED',       // 临时锁定 (安全策略)
  DISABLED = 'DISABLED',   // 永久禁用 (管理员操作)
  UNVERIFIED = 'UNVERIFIED' // 待验证
}