/**
 * Editor Workspace Created Event
 *
 * Triggered when: A new editor workspace is created
 * Subscribers: Editor service
 *
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface EditorWorkspaceCreatedDomainEvent {
  /** The identity that owns this workspace */
  identityId: string;
  /** The name of the workspace */
  name: string;
  /** The project path associated with the workspace, if any */
  projectPath: string | null;
  /** The type of project, if any */
  projectType: string | null;
}
