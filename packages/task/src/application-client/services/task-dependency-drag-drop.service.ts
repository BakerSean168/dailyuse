/**
 * Task Dependency Drag-Drop Service
 *
 * Handles dependency creation via drag-and-drop operations.
 * Includes validation and integration with DAG updates.
 *
 * Pattern A: ApplicationService only handles API calls
 * UI feedback (success/error messages) should be handled by Composables
 *
 * @module TaskDependencyDragDropService
 */

import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO, TaskDependencyClientDTO, ValidateDependencyRequest, CreateTaskDependencyRequest, DependencyType } from '@dailyuse/contracts/task';
import { taskDependencyApiClient } from '../../infrastructure-client/task.container';


/**
 * Result of dependency creation
 */
export interface DependencyCreationResult {
  success: boolean;
  dependency?: TaskDependencyClientDTO;
  error?: string;
}

/**
 * Service for drag-and-drop dependency creation
 */
export class TaskDependencyDragDropService {
  /**
   * Create dependency from drag-and-drop operation
   *
   * Workflow:
   * 1. Validate dependency (check for cycles, duplicates, etc.)
   * 2. Create dependency via API
   * 3. Show success/error notification
   * 4. Trigger DAG refresh (handled by caller)
   *
   * @param sourceTask The task that depends on target (dragged task)
   * @param targetTask The task that source depends on (drop target)
   * @param dependencyType Type of dependency (default: FINISH_TO_START)
   * @returns Promise with creation result
   *
   * @example
   * ```typescript
   * const service = new TaskDependencyDragDropService();
   * const result = await service.createDependencyFromDrop(taskA, taskB);
   * if (result.success) {
   *   // Refresh DAG visualization
   *   dagService.refresh();
   * }
   * ```
   */
  async createDependencyFromDrop(
    sourceTask: TaskTemplateClientDTO,
    targetTask: TaskTemplateClientDTO,
    dependencyType: DependencyType = 'FINISH_TO_START' as DependencyType,
  ): Promise<DependencyCreationResult> {
    try {
      // Step 1: Validate dependency
      const validation = await this.validateDependency(sourceTask, targetTask);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.reason || '验证失败',
        };
      }

      // Step 2: Create dependency request
      const request: CreateTaskDependencyRequest = {
        accountUuid: sourceTask.accountUuid,
        predecessorTaskUuid: targetTask.uuid, // targetTask is the predecessor (must finish first)
        successorTaskUuid: sourceTask.uuid, // sourceTask is the successor (depends on predecessor)
        dependencyType,
        lagDays: 0,
      };

      // Step 3: Call API
      console.log('[DragDropService] Creating dependency:', {
        source: sourceTask.title,
        target: targetTask.title,
        type: dependencyType,
      });

      const dependency = await taskDependencyApiClient.createDependency(sourceTask.uuid, request);

      return {
        success: true,
        dependency,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建依赖关系失败';

      console.error('[DragDropService] Failed to create dependency:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate dependency creation
   *
   * @param sourceTask Task that will depend on target
   * @param targetTask Task that source will depend on
   * @returns Validation result
   */
  private async validateDependency(
    sourceTask: TaskTemplateClientDTO,
    targetTask: TaskTemplateClientDTO,
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Use existing validation service
      const validationRequest: ValidateDependencyRequest = {
        predecessorTaskUuid: targetTask.uuid,
        successorTaskUuid: sourceTask.uuid,
      };

      const validationResponse =
        await taskDependencyApiClient.validateDependency(validationRequest);

      return {
        isValid: validationResponse.isValid,
        reason: validationResponse.errors?.[0] || validationResponse.message,
      };
    } catch (error) {
      console.error('[DragDropService] Validation failed:', error);
      return {
        isValid: false,
        reason: error instanceof Error ? error.message : '验证失败',
      };
    }
  }

  /**
   * Quick validation for drop target highlighting
   * This is a faster, client-side-only validation for immediate visual feedback
   *
   * @param sourceTask Source task
   * @param targetTask Target task
   * @returns True if drop is likely valid (not definitive)
   */
  canDropOn(sourceTask: TaskTemplateClientDTO, targetTask: TaskTemplateClientDTO): boolean {
    // Cannot drop on self
    if (sourceTask.uuid === targetTask.uuid) {
      return false;
    }

    // Cannot create dependency if target is already completed
    if (targetTask.status === 'ARCHIVED') {
      return false;
    }

    // Cannot create dependency if source is already completed
    if (sourceTask.status === 'ARCHIVED') {
      return false;
    }

    // For full validation (cycles, duplicates), use validateDependency()
    // This is just for quick visual feedback
    return true;
  }
}

