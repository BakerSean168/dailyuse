/** Shared personal classification contract (ADR-054). */
export interface LabelDto {
  readonly id: string;
  readonly identityId: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly color: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CreateLabelCommand {
  readonly identityId: string;
  readonly name: string;
  readonly color?: string | null;
}

export interface UpdateLabelCommand {
  readonly identityId: string;
  readonly labelId: string;
  readonly name?: string;
  readonly color?: string | null;
}

export interface DeleteLabelCommand {
  readonly identityId: string;
  readonly labelId: string;
}

export interface ListLabelsQuery {
  readonly identityId: string;
  readonly search?: string | null;
  readonly limit?: number;
}

export interface LabelAssignmentCommand {
  readonly identityId: string;
  readonly labelIds: readonly string[];
}

export interface GoalLabelAssignmentCommand extends LabelAssignmentCommand {
  readonly goalId: string;
}

export interface TaskLabelAssignmentCommand extends LabelAssignmentCommand {
  readonly taskTemplateId: string;
}
