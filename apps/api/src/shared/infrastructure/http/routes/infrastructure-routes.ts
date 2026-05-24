/**
 * @file infrastructureRoutes.ts
 * @description 基础设施路由 - 提供 K8s 探针、应用信息、指标等运维端点
 * 
 * 这些路由不走版本控制，直接挂载在根路径：
 * - /healthz - Liveness probe
 * - /readyz - Readiness probe  
 * - /livez - Liveness probe (K8s 1.16+ 兼容)
 * - /info - 应用信息
 * - /metrics - Prometheus 格式指标
 * - /logs - 客户端日志上报
 * 
 * @date 2025-12-22
 */

import { Router, type Router as ExpressRouter } from 'express';
import { 
  healthController, 
  infoController, 
  metricsController, 
  logsController,
} from '../controllers';

const router: ExpressRouter = Router();

// ============================================
// Health Probes (K8s 兼容)
// ============================================

/**
 * Liveness Probe - 存活检查
 * K8s 用于判断是否需要重启容器
 * 
 * @route GET /healthz
 * @returns {object} { status: 'ok' }
 */
router.get('/healthz', healthController.liveness);

/**
 * Readiness Probe - 就绪检查
 * K8s 用于判断是否可以将流量路由到此 Pod
 * 检查数据库等依赖服务的连接状态
 * 
 * @route GET /readyz
 * @returns {object} { status: 'ok'|'degraded', checks: {...}, timestamp: string }
 */
router.get('/readyz', healthController.readiness);

/**
 * Liveness Probe 别名 (K8s 1.16+ 标准)
 * 
 * @route GET /livez
 * @returns {object} { status: 'ok' }
 */
router.get('/livez', healthController.liveness);

// ============================================
// 应用信息
// ============================================

/**
 * 应用信息端点
 * 提供版本、环境、运行时间等信息
 * 
 * @route GET /info
 * @returns {object} 应用详细信息
 */
router.get('/info', infoController.getInfo);

// ============================================
// 性能指标
// ============================================

/**
 * Prometheus 格式指标
 * 用于 Prometheus 抓取
 * 
 * @route GET /metrics
 * @returns {string} Prometheus 文本格式指标
 */
router.get('/metrics', metricsController.getPrometheus);

/**
 * JSON 格式指标
 * 用于调试和自定义仪表板
 * 
 * @route GET /metrics/json
 * @returns {object} JSON 格式指标数据
 */
router.get('/metrics/json', metricsController.getJson);

// ============================================
// 客户端日志上报
// ============================================

/**
 * 客户端日志上报
 * 接收前端错误日志，不需要认证
 * 
 * @route POST /logs
 * @body { logs: Array<LogEntry> }
 * @returns {object} { success: true, processed: number }
 */
router.post('/logs', logsController.capture);

// ============================================
// 向后兼容路由（可在未来版本移除）
// ============================================

/**
 * 旧版健康检查路径
 * @deprecated 请使用 /healthz
 * 
 * @route GET /health
 */
router.get('/health', healthController.liveness);

export default router;
