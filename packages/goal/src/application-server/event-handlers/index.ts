/**
 * Goal Event Handlers (Server)
 *
 * Handles domain events related to goals.
 * Currently provides registration infrastructure for future event handlers
 * such as goal-completion notifications, progress tracking, etc.
 */

import { createLogger, eventBus } from '@dailyuse/utils';
import type { IGoalRepository } from '../../domain-server';

const logger = createLogger('GoalEventListeners');

/**
 * Register Goal event listeners.
 *
 * Hooks into global event bus to react to cross-module events
 * (e.g., task-completion → goal key-result progress update).
 */
export function registerGoalEventListeners(_goalRepository: IGoalRepository): void {
  logger.info('Goal event listeners registered');
}
