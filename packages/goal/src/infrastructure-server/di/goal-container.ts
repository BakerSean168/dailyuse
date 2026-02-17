import type {
  IGoalFolderRepository,
  IGoalRecordRepository,
  IGoalRepository,
} from '../../domain-server';

export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository?: IGoalRepository;
  private goalFolderRepository?: IGoalFolderRepository;
  private goalRecordRepository?: IGoalRecordRepository;

  private constructor() {}

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  setGoalRepository(repository: IGoalRepository): void {
    this.goalRepository = repository;
  }

  setGoalFolderRepository(repository: IGoalFolderRepository): void {
    this.goalFolderRepository = repository;
  }

  setGoalRecordRepository(repository: IGoalRecordRepository): void {
    this.goalRecordRepository = repository;
  }

  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      throw new Error('GoalRepository not registered in GoalContainer');
    }
    return this.goalRepository;
  }

  getGoalFolderRepository(): IGoalFolderRepository {
    if (!this.goalFolderRepository) {
      throw new Error('GoalFolderRepository not registered in GoalContainer');
    }
    return this.goalFolderRepository;
  }

  getGoalRecordRepository(): IGoalRecordRepository {
    if (!this.goalRecordRepository) {
      throw new Error('GoalRecordRepository not registered in GoalContainer');
    }
    return this.goalRecordRepository;
  }

  reset(): void {
    this.goalRepository = undefined;
    this.goalFolderRepository = undefined;
    this.goalRecordRepository = undefined;
  }
}
