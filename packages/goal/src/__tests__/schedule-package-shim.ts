import type { ScheduleConfigDTO, SourceModule, TaskMetadataDTO } from '@dailyuse/contracts/schedule';

interface CreateScheduleTaskInput {
  readonly identityId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly sourceModule: SourceModule;
  readonly sourceEntityId: string;
  readonly schedule: ScheduleConfigDTO;
  readonly metadata: TaskMetadataDTO;
}

type TestTaskMetadata = TaskMetadataDTO & {
  toDTO(): TaskMetadataDTO;
};

function createMetadata(metadata: TaskMetadataDTO): TestTaskMetadata {
  return {
    ...metadata,
    toDTO() {
      return metadata;
    },
  };
}

export class ScheduleTask {
  readonly id: string;
  readonly identityId: string;
  readonly name: string;
  readonly description: string | null;
  readonly sourceModule: SourceModule;
  readonly sourceEntityId: string;
  readonly schedule: ScheduleConfigDTO;
  readonly metadata: TestTaskMetadata;

  private constructor(input: CreateScheduleTaskInput) {
    this.id = `ScheduleTaskId_${input.sourceEntityId}`;
    this.identityId = input.identityId;
    this.name = input.name;
    this.description = input.description ?? null;
    this.sourceModule = input.sourceModule;
    this.sourceEntityId = input.sourceEntityId;
    this.schedule = input.schedule;
    this.metadata = createMetadata(input.metadata);
  }

  static create(input: CreateScheduleTaskInput): ScheduleTask {
    return new ScheduleTask(input);
  }
}
