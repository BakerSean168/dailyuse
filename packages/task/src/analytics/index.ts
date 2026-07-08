/**
 * Task analytics read seam.
 *
 * Narrow public surface for host modules that need aggregated task read models
 * without depending on the full server application layer.
 */

export { GetTaskDashboardUseCase } from '../server/application/use-cases/queries/get-task-dashboard.use-case';
