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
import { healthController, infoController, logsController } from '../controllers';
import { createMetricsController } from '../controllers/metrics.controller';
import type { MetricsStore } from '../middlewares/performance.middleware';

export function createInfrastructureRouter(metricsStore: MetricsStore): ExpressRouter {
  const router: ExpressRouter = Router();
  const metricsController = createMetricsController(metricsStore);

  // ============================================
  // Health Probes (K8s 兼容)
  // ============================================

  router.get('/healthz', healthController.liveness);
  router.get('/readyz', healthController.readiness);
  router.get('/livez', healthController.liveness);

  // ============================================
  // 应用信息
  // ============================================

  router.get('/info', infoController.getInfo);

  // ============================================
  // 性能指标
  // ============================================

  router.get('/metrics', metricsController.getPrometheus);
  router.get('/metrics/json', metricsController.getJson);

  // ============================================
  // 客户端日志上报
  // ============================================

  router.post('/logs', logsController.capture);

  // ============================================
  // 向后兼容路由（可在未来版本移除）
  // ============================================

  router.get('/health', healthController.liveness);

  return router;
}

export default createInfrastructureRouter;
