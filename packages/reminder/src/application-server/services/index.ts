/**
 * CRUD Operations
 * Individual services for each CRUD operation following Single Responsibility Principle
 */
export { CreateReminderTemplate } from './create-reminder-template';
export { GetReminderTemplate } from './get-reminder-template';
export { ListReminderTemplates } from './list-reminder-templates';
export { UpdateReminderTemplate } from './update-reminder-template';
export { DeleteReminderTemplate } from './delete-reminder-template';

/**
 * Frequency Management Services
 * Services for analyzing and adjusting reminder frequency
 */
export { AnalyzeReminderFrequency } from './analyze-reminder-frequency';
export { AdjustReminderFrequency } from './adjust-reminder-frequency';
export { RecordReminderResponse } from './record-reminder-response';

/**
 * Event Publishing (Internal)
 * Centralized event publishing orchestrator
 */
export { ReminderEventPublisher } from './reminder-event-publisher';

/**
 * Query Services
 * Services for querying reminder data
 */
export { ReminderQueryApplicationService } from './reminder-query-application-service';

/**
 * @deprecated Use individual services instead (CreateReminderTemplate, UpdateReminderTemplate, DeleteReminderTemplate, etc.)
 * This service is kept for backward compatibility but should not be used in new code.
 * Each operation has been extracted into its own service following the Single Responsibility Principle.
 * 
 * Migration Guide:
 * - createReminderTemplate() → CreateReminderTemplate.execute()
 * - updateReminderTemplate() → UpdateReminderTemplate.execute()
 * - deleteReminderTemplate() → DeleteReminderTemplate.execute()
 * - getReminderTemplate() → GetReminderTemplate.execute()
 * - getReminderTemplatesByAccount() → ListReminderTemplates.execute()
 */
export { ReminderApplicationService } from './reminder-application-service';
