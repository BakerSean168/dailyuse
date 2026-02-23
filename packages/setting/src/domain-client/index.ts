/**
 * Setting Module - Domain Client
 * Setting 模块 - 领域客户端
 *
 * 【模块职责】
 * 管理用户设置的客户端领域模型
 *
 * 【包含内容】
 * - 聚合根（Aggregates）：UserSetting（分类偏好模型）
 * - 值对象（Value Objects）：从 domain-shared 导入
 *
 * 【新设计】
 * 使用类型安全的「分类偏好」模型:
 *   - appearance, locale, workflow, privacy 等分类
 *   - 与 domain-server 保持一致的数据结构
 *   - 通过 UserSettingClientDTO 与 API 通信
 *
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、Client 接口、偏好类型）
 * - @dailyuse/domain-shared（值对象、枚举）
 *
 * ❌ 禁止依赖：
 * - @dailyuse/domain-server（服务端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 */

// ===== Aggregates =====
export * from './aggregates';

// ===== Value Objects (re-export from domain-shared) =====
export * from '../domain-shared/value-objects';
