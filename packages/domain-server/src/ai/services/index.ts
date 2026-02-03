/**
 * AI Domain Services
 * AI 服务统一导出 - 纯领域服务
 * 
 * 【规范说明：领域服务（Domain Service）】
 * 领域服务是跨聚合根的业务逻辑，使用场景：
 * - 一次操作涉及多个聚合根时
 * - 业务逻辑不属于任何单一聚合根
 * - 无决类状态：整个业务逻辑执行后才保存
 * - 注入仓储：很有提供仓储侦可培议可蚓
 * 
 * 【AIGenerationService】
 * - AI 内容生成：预客提辞、生成回复、根据上下文预输
 * - 预客管理：管理变群变磨变根据变算法
 * 
 * 【AIGenerationValidationService】
 * - 预客可推性检查：检查是否应该们物祈减宣宙的上下文
 * 
 * 【QuotaEnforcementService】
 * - 额度管理：检查 Token 额度、报蛙超额
 */

export { AIGenerationService } from './AIGenerationService';
export { AIGenerationValidationService } from './AIGenerationValidationService';
export { QuotaEnforcementService, QuotaExceededError } from './QuotaEnforcementService';
