import type {
  CreateLabelCommand,
  DeleteLabelCommand,
  GoalLabelAssignmentCommand,
  LabelDto,
  ListLabelsQuery,
  TaskLabelAssignmentCommand,
  UpdateLabelCommand,
} from '@memoflow/contracts/label'
import { normalizeLabelName, validateLabelName } from '../domain/label'
import type { LabelRepository } from '../domain/label-repository'

export interface LabelServiceOptions {
  readonly now?: () => number
  readonly idFactory?: () => string
}

export class LabelService {
  private readonly now: () => number
  private readonly idFactory: () => string

  constructor(private readonly repository: LabelRepository, options: LabelServiceOptions = {}) {
    this.now = options.now ?? (() => Date.now())
    this.idFactory = options.idFactory ?? (() => globalThis.crypto.randomUUID())
  }

  async create(command: CreateLabelCommand): Promise<LabelDto> {
    const name = validateLabelName(command.name)
    const now = this.now()
    return this.repository.create({
      id: this.idFactory(),
      identityId: command.identityId,
      name: name.name,
      normalizedName: name.normalizedName,
      color: command.color ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  async update(command: UpdateLabelCommand): Promise<LabelDto> {
    const labelName = command.name === undefined ? undefined : validateLabelName(command.name)
    const updated = await this.repository.update({
      identityId: command.identityId,
      labelId: command.labelId,
      ...(labelName ? { name: labelName.name, normalizedName: labelName.normalizedName } : {}),
      ...(command.color !== undefined ? { color: command.color } : {}),
    })
    if (!updated) throw new Error('Label not found.')
    return updated
  }

  delete(command: DeleteLabelCommand): Promise<boolean> {
    return this.repository.delete(command.identityId, command.labelId)
  }

  list(query: ListLabelsQuery): Promise<LabelDto[]> {
    return this.repository.list({
      identityId: query.identityId,
      normalizedSearch: query.search ? normalizeLabelName(query.search) : null,
      limit: query.limit,
    })
  }

  setGoalLabels(command: GoalLabelAssignmentCommand): Promise<void> {
    return this.repository.replaceGoalLabels(command.identityId, command.goalId, unique(command.labelIds))
  }

  setTaskLabels(command: TaskLabelAssignmentCommand): Promise<void> {
    return this.repository.replaceTaskLabels(
      command.identityId,
      command.taskTemplateId,
      unique(command.labelIds),
    )
  }
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}
