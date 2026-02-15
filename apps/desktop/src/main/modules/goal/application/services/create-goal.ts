/**
 * Create Goal Service
 * 
 * Wrapper service that instantiates the application service with dependencies from DI container
 * and handles Result<T> pattern.
 */

import { CreateGoal } from '@dailyuse/goal/application-server';
import type { CreateGoalRequest, GoalClientDTO } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';
import { unwrapResult } from '@dailyuse/contracts/result';

const logger = createLogger('CreateGoalService');

/**
 * Get dependencies from global DI container
 */
function getDependencies() {
  const container = (global as any)._goalContainer;
  if (!container) {
    throw new Error('Goal module not configured. Call configureMainProcessDependencies() first.');
  }
  return container;
}

export async function createGoalService(accountUuid: string, params: CreateGoalRequest): Promise<GoalClientDTO> {
  logger.debug('Creating goal', { title: params.title });
  
  // Get dependencies from DI container
  const { goalRepository, goalPolicy } = getDependencies();
  
  // Instantiate application service
  const createGoal = new CreateGoal(goalRepository, goalPolicy);
  
  // Execute and handle Result<T>
  const result = await createGoal.execute(params, { identityId: accountUuid });
  
  // Unwrap result or throw error
  return unwrap(result);
}
