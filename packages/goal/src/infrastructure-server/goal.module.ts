import type {
  IGoalRepository,
  IGoalFolderRepository,
  IGoalRecordRepository,
} from '../domain-server';
import { GoalPolicy, GoalProgressCalculator } from '../domain-server';
import {
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ArchiveGoal,
  ActivateGoal,
  SearchGoals,
  ListGoalFolders,
  CreateGoalFolder,
  GetGoalFolder,
  UpdateGoalFolder,
  DeleteGoalFolder,
  AddGoalKeyResult,
  UpdateGoalKeyResult,
  UpdateGoalKeyResultProgress,
  DeleteGoalKeyResult,
  AddGoalReview,
} from '../application-server';

export interface GoalModuleRepositories {
  readonly goalRepository: IGoalRepository;
  readonly goalFolderRepository: IGoalFolderRepository;
  readonly goalRecordRepository: IGoalRecordRepository;
}

export class GoalModule {
  public readonly goalRepository: IGoalRepository;
  public readonly goalFolderRepository: IGoalFolderRepository;
  public readonly goalRecordRepository: IGoalRecordRepository;

  public readonly goalPolicy: GoalPolicy;
  public readonly goalProgressCalculator: GoalProgressCalculator;

  public readonly createGoal: CreateGoal;
  public readonly getGoal: GetGoal;
  public readonly listGoals: ListGoals;
  public readonly updateGoal: UpdateGoal;
  public readonly deleteGoal: DeleteGoal;
  public readonly archiveGoal: ArchiveGoal;
  public readonly activateGoal: ActivateGoal;
  public readonly searchGoals: SearchGoals;

  public readonly listGoalFolders: ListGoalFolders;
  public readonly createGoalFolder: CreateGoalFolder;
  public readonly getGoalFolder: GetGoalFolder;
  public readonly updateGoalFolder: UpdateGoalFolder;
  public readonly deleteGoalFolder: DeleteGoalFolder;

  public readonly addKeyResult: AddGoalKeyResult;
  public readonly updateKeyResult: UpdateGoalKeyResult;
  public readonly updateKeyResultProgress: UpdateGoalKeyResultProgress;
  public readonly deleteKeyResult: DeleteGoalKeyResult;
  public readonly addReview: AddGoalReview;

  constructor(repositories: GoalModuleRepositories) {
    this.goalRepository = repositories.goalRepository;
    this.goalFolderRepository = repositories.goalFolderRepository;
    this.goalRecordRepository = repositories.goalRecordRepository;

    this.goalPolicy = new GoalPolicy();
    this.goalProgressCalculator = new GoalProgressCalculator(this.goalRecordRepository);

    this.createGoal = new CreateGoal(this.goalRepository, this.goalPolicy);
    this.getGoal = new GetGoal(this.goalRepository);
    this.listGoals = new ListGoals(this.goalRepository);
    this.updateGoal = new UpdateGoal(this.goalRepository, this.goalPolicy);
    this.deleteGoal = new DeleteGoal(this.goalRepository, this.goalPolicy);
    this.archiveGoal = new ArchiveGoal(this.goalRepository, this.goalPolicy);
    this.activateGoal = new ActivateGoal(this.goalRepository, this.goalPolicy);
    this.searchGoals = new SearchGoals(this.goalRepository);

    this.listGoalFolders = new ListGoalFolders(this.goalFolderRepository);
    this.createGoalFolder = new CreateGoalFolder(this.goalFolderRepository);
    this.getGoalFolder = new GetGoalFolder(this.goalFolderRepository);
    this.updateGoalFolder = new UpdateGoalFolder(this.goalFolderRepository);
    this.deleteGoalFolder = new DeleteGoalFolder(this.goalFolderRepository);

    this.addKeyResult = new AddGoalKeyResult(this.goalRepository, this.goalPolicy);
    this.updateKeyResult = new UpdateGoalKeyResult(this.goalRepository, this.goalPolicy);
    this.updateKeyResultProgress = new UpdateGoalKeyResultProgress(this.goalRepository, this.goalPolicy);
    this.deleteKeyResult = new DeleteGoalKeyResult(this.goalRepository, this.goalPolicy);
    this.addReview = new AddGoalReview(this.goalRepository, this.goalPolicy);
  }
}
