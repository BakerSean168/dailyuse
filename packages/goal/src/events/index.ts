/**
 * Goal event orchestration seam.
 *
 * Narrow public surface for host-level event listeners that need to create goal
 * records without depending on the full server application layer.
 */

export { CreateGoalRecordUseCase } from '../server/application/use-cases/commands/create-goal-record.use-case';
export { registerGoalEventListeners } from '../server/application/event-handlers';
