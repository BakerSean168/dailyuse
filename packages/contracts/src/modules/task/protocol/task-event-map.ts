/**
 * Task Domain Event Map
 * 
 * Event Naming Convention: task:<action>
 * - task:create - Template created
 * - task:update - Template updated
 * - task:delete - Template deleted
 * - task:instance-create - Instance created
 * - task:complete - Instance completed
 * - task:uncomplete - Instance uncompleted
 * - task:reschedule - Instance rescheduled
 */
export interface TaskEventMap {
  // ================= Template Events (Metadata Changes) =================
  'task:create': {
    templateId: string;
    identityId: string;
    linkedKeyResultId?: string; // Associated OKR if any
  };
  'task:update': {
    templateId: string;
  };
  'task:delete': {
    templateId: string;
  };

  // ================= Instance Events (Execution State Changes) =================
  
  // 1. New task instance generated (Schedule module may listen for calendar sync)
  'task:instance-create': {
    instanceId: string;
    templateId: string;
    date: string; // ISO Date
    scheduledTime: { start: string; end?: string } | null;
  };

  // 2. Task completed (Goal module listens to increment KeyResult progress)
  'task:complete': {
    instanceId: string;
    templateId: string;
    identityId: string;
    completedAt: string;
    linkedKeyResultId?: string; // For efficient filtering by Goal module
    impactValue?: number;       // Contribution value
  };

  // 3. Task uncompleted (rollback - Goal module needs to decrement progress)
  'task:uncomplete': {
    instanceId: string;
    linkedKeyResultId?: string;
  };

  // 4. Task rescheduled/postponed (Schedule module updates calendar)
  'task:reschedule': {
    instanceId: string;
    originalDate: string;
    newDate: string;
  };
}