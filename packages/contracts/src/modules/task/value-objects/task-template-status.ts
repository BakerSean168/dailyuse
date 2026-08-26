/** Canonical Task plan lifecycle. Archive/delete are orthogonal metadata. */
export const TaskTemplateStatus = {
  Active: 'Active',
  Paused: 'Paused',
  Closed: 'Closed',
} as const;

export type TaskTemplateStatus = (typeof TaskTemplateStatus)[keyof typeof TaskTemplateStatus];
