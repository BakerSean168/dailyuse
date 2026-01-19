import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { getAllMetrics } from '@/shared/infrastructure/http/middlewares/performance.middleware';

const router: ExpressRouter = Router();

/**
 * GET /api/v1/metrics/performance
 * Get performance metrics for all endpoints
 * Admin only endpoint
 */
router.get('/performance', (_req: Request, res: Response) => {
  try {
    const metrics = getAllMetrics();

    // Calculate overall statistics
    const allEndpoints = Object.entries(metrics);
    const totalRequests = allEndpoints.reduce((sum, [_, stats]) => sum + (stats?.count || 0), 0);

    const avgResponseTimes = allEndpoints.map(([_, stats]) => stats?.avg || 0).filter(Boolean);
    const overallAvg =
      avgResponseTimes.length > 0
        ? Math.round(avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length)
        : 0;

    // Find slow endpoints (avg > 200ms)
    const slowEndpoints = allEndpoints
      .filter(([_, stats]) => (stats?.avg || 0) > 200)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgMs: stats?.avg,
        p95Ms: stats?.p95,
        p99Ms: stats?.p99,
        maxMs: stats?.max,
      }));

    res.json({
      summary: {
        totalRequests,
        overallAvgMs: overallAvg,
        endpointCount: allEndpoints.length,
        slowEndpointCount: slowEndpoints.length,
      },
      slowEndpoints,
      allMetrics: metrics,
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

export function registerMetricsDetailsRoutes(): Router {
  return router;
}
