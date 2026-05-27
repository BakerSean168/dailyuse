/**
 * Dashboard read-model port interface and record types.
 *
 * These define the contract that any data source must implement
 * to feed the dashboard projection logic.
 */

export interface DashboardGoalRecord {
  id: string;
  name: string;
  status: string;
  deletedAt: Date | null;
  priority: number;
  updatedAt: Date;
  progress: number;
  targetDate: Date | null;
  keyResults: readonly unknown[];
}

export interface DashboardTaskTemplateRecord {
  id: string;
  title: string;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface DashboardTaskInstanceRecord {
  id: string;
  templateId: string;
  status: string;
  instanceDate: number;
  actualEndTime: number | null;
  updatedAt: number;
  deletedAt: Date | null;
  isOverdue(): boolean;
}

export interface DashboardScheduleRecord {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  priority?: number | null;
  hasConflict: boolean;
  createdAt: Date;
}

export interface DashboardReminderRecord {
  deletedAt: Date | null;
  status: string;
  effectiveEnabled: boolean;
  nextTriggerAt: number | null;
}

/**
 * Port interface for dashboard data sources.
 * Implementations wire this to Prisma (API), PowerSync (Desktop), etc.
 */
export interface DashboardReadSource {
  listGoals(identityId: string): Promise<DashboardGoalRecord[]>;
  listTaskTemplates(identityId: string): Promise<DashboardTaskTemplateRecord[]>;
  listTaskInstances(identityId: string): Promise<DashboardTaskInstanceRecord[]>;
  listSchedules(identityId: string): Promise<DashboardScheduleRecord[]>;
  listUpcomingReminders(identityId: string, beforeTime: number): Promise<DashboardReminderRecord[]>;
  countUnreadNotifications(identityId: string): Promise<number>;
}
