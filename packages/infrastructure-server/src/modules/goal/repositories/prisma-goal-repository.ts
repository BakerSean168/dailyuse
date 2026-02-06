import type { PrismaClient, goal as PrismaGoal } from '../../../generated/prisma/client';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal, KeyResult, GoalReview } from '@dailyuse/domain-server/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  // importance is a String type in Prisma schema
  private importanceMap: Record<ImportanceLevel, string> = {
    [ImportanceLevel.Vital]: 'Vital',
    [ImportanceLevel.Important]: 'Important',
    [ImportanceLevel.Moderate]: 'Moderate',
    [ImportanceLevel.Minor]: 'Minor',
    [ImportanceLevel.Trivial]: 'Trivial',
  };

  private reverseImportanceMap: Record<string, ImportanceLevel> = {
    'Vital': ImportanceLevel.Vital,
    'Important': ImportanceLevel.Important,
    'Moderate': ImportanceLevel.Moderate,
    'Minor': ImportanceLevel.Minor,
    'Trivial': ImportanceLevel.Trivial,
  };

  private urgencyMap: Record<UrgencyLevel, number> = {
    [UrgencyLevel.Critical]: 4,
    [UrgencyLevel.High]: 3,
    [UrgencyLevel.Medium]: 2,
    [UrgencyLevel.Low]: 1,
    [UrgencyLevel.None]: 0,
  };

  private reverseUrgencyMap: Record<number, UrgencyLevel> = {
    4: UrgencyLevel.Critical,
    3: UrgencyLevel.High,
    2: UrgencyLevel.Medium,
    1: UrgencyLevel.Low,
    0: UrgencyLevel.None,
  };

  /**
   * Map Prisma model to domain entity
   * Note: Prisma Client automatically converts @map fields to camelCase
   */
  private mapToEntity(data: PrismaGoal & { keyResults?: any[]; keyResult?: any[]; goalReview?: any[] }): Goal {
    console.log('[PrismaGoalRepository.mapToEntity] Starting to map Goal UUID:', data.uuid);
    console.log('[PrismaGoalRepository.mapToEntity] data.keyResults:', data.keyResults);
    console.log('[PrismaGoalRepository.mapToEntity] data.keyResult:', data.keyResult);
    console.log('[PrismaGoalRepository.mapToEntity] data.goalReview:', data.goalReview);
    
    const goal = Goal.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid, // Prisma camelCase
      name: data.name,
      description: data.description,
      color: data.color, // new field
      feasibilityAnalysis: data.feasibilityAnalysis, // new field (Prisma camelCase)
      motivation: data.motivation, // new field
      status: data.status as GoalStatus,
      importance: this.reverseImportanceMap[data.importance],
      // urgency: removed - priority now computed from importance + targetDate
      category: data.category,
      tags: data.tags ?? '[]',
      startDate: data.startDate ? data.startDate.getTime() : null, // Prisma camelCase
      targetDate: data.targetDate ? data.targetDate.getTime() : null, // Prisma camelCase
      completedAt: data.completedAt ? data.completedAt.getTime() : null, // Prisma camelCase
      archivedAt: data.archivedAt ? data.archivedAt.getTime() : null, // Prisma camelCase
      folderUuid: data.folderUuid, // Prisma camelCase
      parentGoalUuid: data.parentGoalUuid, // Prisma camelCase
      sortOrder: data.sortOrder, // Prisma camelCase
      reminderConfig: data.reminderConfig, // Prisma camelCase
      createdAt: data.createdAt.getTime(), // Prisma camelCase
      updatedAt: data.updatedAt.getTime(), // Prisma camelCase
      deletedAt: data.deletedAt ? data.deletedAt.getTime() : null, // Prisma camelCase
    });

    // Restore KeyResults (if any)
    // Support both keyResults and keyResult (singular/plural)
    const keyResultsData = data.keyResults || data.keyResult || [];
    console.log('[PrismaGoalRepository.mapToEntity] keyResultsData length:', keyResultsData.length);
    
    if (keyResultsData.length > 0) {
      console.log('[PrismaGoalRepository.mapToEntity] Starting to restore KeyResults...');
      for (const krData of keyResultsData) {
        console.log('[PrismaGoalRepository.mapToEntity] KeyResult original data:', {
          uuid: krData.uuid,
          name: krData.name,
          goalRecordCount: krData.goalRecord?.length || 0,
        });
        
        // Build KeyResult from flattened database fields
        const keyResult = KeyResult.fromServerDTO({
          uuid: krData.uuid,
          goalUuid: data.uuid,
          name: krData.name,
          description: krData.description,
          progress: {
            valueType: krData.valueType as any,
            aggregationMethod: krData.aggregationMethod as any,
            initialValue: undefined, // Field not available in database yet
            targetValue: krData.targetValue,
            currentValue: krData.currentValue,
            unit: krData.unit,
          },
          weight: krData.weight,
          order: krData.order,
          createdAt: krData.createdAt instanceof Date ? krData.createdAt.getTime() : krData.createdAt,
          updatedAt: krData.updatedAt instanceof Date ? krData.updatedAt.getTime() : krData.updatedAt,
          records: null,
        });
        
        // Restore GoalRecords (if any)
        if (krData.goalRecord && krData.goalRecord.length > 0) {
          console.log(`[PrismaGoalRepository.mapToEntity] Restoring ${krData.goalRecord.length} GoalRecords...`);
          for (const recordData of krData.goalRecord) {
            keyResult.addRecord({
              uuid: recordData.uuid,
              keyResultUuid: krData.uuid,
              goalUuid: data.uuid,
              value: recordData.value,  // Independent value for each record
              note: recordData.note,
              recordedAt: recordData.recordedAt instanceof Date 
                ? recordData.recordedAt.getTime() 
                : recordData.recordedAt,
              createdAt: recordData.createdAt instanceof Date 
                ? recordData.createdAt.getTime() 
                : recordData.createdAt,
            });
          }
          console.log(`[PrismaGoalRepository.mapToEntity] All GoalRecords restored`);
        }
        
        goal.addKeyResult(keyResult);
        console.log('[PrismaGoalRepository.mapToEntity] KeyResult added to Goal');
      }
    } else {
      console.log('[PrismaGoalRepository.mapToEntity] No KeyResults data');
    }

    console.log('[PrismaGoalRepository.mapToEntity] Goal entity keyResults count:', goal.keyResults?.length || 0);

    // Restore GoalReviews (if any)
    const reviewsData = data.goalReview || [];
    if (reviewsData.length > 0) {
      console.log(`[PrismaGoalRepository.mapToEntity] Starting to restore ${reviewsData.length} GoalReviews...`);
      for (const reviewData of reviewsData) {
        const review = GoalReview.fromServerDTO({
          uuid: reviewData.uuid,
          goalUuid: data.uuid,
          type: reviewData.reviewType as any,
          rating: reviewData.rating || 5,
          summary: reviewData.content,
          achievements: reviewData.achievements,
          challenges: reviewData.challenges,
          improvements: reviewData.lessonsLearned,
          keyResultSnapshots: [], // Snapshots not supported yet
          reviewedAt: reviewData.createdAt instanceof Date 
            ? reviewData.createdAt.getTime() 
            : reviewData.createdAt,
          createdAt: reviewData.createdAt instanceof Date 
            ? reviewData.createdAt.getTime() 
            : reviewData.createdAt,
        });
        goal.addReview(review);
        console.log(`[PrismaGoalRepository.mapToEntity] GoalReview ${reviewData.uuid} added to Goal`);
      }
      console.log(`[PrismaGoalRepository.mapToEntity] All ${reviewsData.length} GoalReviews restored`);
    } else {
      console.log('[PrismaGoalRepository.mapToEntity] No GoalReviews data');
    }

    return goal;
  }

  /**
   * Save domain entity to database
   * Note: This handles mapping between camelCase (PersistenceDTO) and snake_case (database)
   * Cascade save child entities: KeyResults and GoalReviews
   */
  async save(goal: Goal): Promise<void> {
    const persistence = goal.toPersistenceDTO();
    const data = {
      name: persistence.name,
      description: persistence.description,
      status: persistence.status,
      importance: this.importanceMap[persistence.importance],
      // urgency: removed - priority now computed from importance + targetDate
      category: persistence.category,
      tags: persistence.tags,
      startDate: persistence.startDate ? new Date(persistence.startDate) : null,
      targetDate: persistence.targetDate ? new Date(persistence.targetDate) : null,
      completedAt: persistence.completedAt ? new Date(persistence.completedAt) : null,
      archivedAt: persistence.archivedAt ? new Date(persistence.archivedAt) : null,
      folderUuid: persistence.folderUuid,
      parentGoalUuid: persistence.parentGoalUuid,
      sortOrder: persistence.sortOrder,
      reminderConfig: persistence.reminderConfig,
      updatedAt: new Date(persistence.updatedAt),
      deletedAt: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
    };

    await this.prisma.goal.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid, // PersistenceDTO to database
        createdAt: new Date(persistence.createdAt), // PersistenceDTO to database
        ...data,
      },
      update: data,
    });

    // Cascade save KeyResults (using ServerDTO to get complete data)
    const serverDTO = goal.toServerDTO(true); // includeChildren=true
    if (serverDTO.keyResults && serverDTO.keyResults.length > 0) {
      for (const kr of serverDTO.keyResults) {
        // Defensive check: ensure progress object exists
        if (!kr.progress) {
          console.error(`KeyResult ${kr.uuid} has no progress data, skipping save`);
          continue;
        }

        // Defensive check: ensure progress object exists
        if (!kr.progress) {
          console.error(`KeyResult ${kr.uuid} has no progress data, skipping save`);
          continue;
        }

        await (this.prisma as any).keyResult.upsert({
          where: { uuid: kr.uuid },
          create: {
            uuid: kr.uuid,
            name: kr.name,
            description: kr.description || null,
            valueType: kr.progress.valueType,
            aggregationMethod: kr.progress.aggregationMethod,
            targetValue: kr.progress.targetValue,
            currentValue: kr.progress.currentValue ?? 0, // Default to 0 if null
            unit: kr.progress.unit || null,
            weight: kr.weight ?? 0, // Add weight field
            order: kr.order,
            createdAt: new Date(kr.createdAt),
            updatedAt: new Date(kr.updatedAt),
            goal: {
              connect: { uuid: goal.uuid }, // Connect to existing Goal
            },
          },
          update: {
            name: kr.name,
            description: kr.description || null,
            valueType: kr.progress.valueType,
            aggregationMethod: kr.progress.aggregationMethod,
            targetValue: kr.progress.targetValue,
            currentValue: kr.progress.currentValue ?? 0, // Default to 0 if null
            unit: kr.progress.unit || null,
            weight: kr.weight ?? 0, // Add weight field
            order: kr.order,
            updatedAt: new Date(kr.updatedAt),
          },
        });

        // Cascade save GoalRecords (progress records)
        if (kr.records && kr.records.length > 0) {
          console.log(`[PrismaGoalRepository.save] Saving ${kr.records.length} GoalRecords for KeyResult ${kr.uuid}`);
          for (const record of kr.records) {
            await (this.prisma as any).goalRecord.upsert({
              where: { uuid: record.uuid },
              create: {
                uuid: record.uuid,
                value: record.value ?? 0,  // Independent value for each record
                note: record.note || null,
                recordedAt: new Date(record.recordedAt),
                createdAt: new Date(record.createdAt),
                keyResult: {
                  connect: { uuid: kr.uuid }, // Connect to existing KeyResult
                },
              },
              update: {
                value: record.value ?? 0,  // Independent value for each record
                note: record.note || null,
                recordedAt: new Date(record.recordedAt),
              },
            });
          }
        }
      }
    }

    // Cascade save GoalReviews
    if (serverDTO.reviews && serverDTO.reviews.length > 0) {
      console.log(`[PrismaGoalRepository.save] Saving ${serverDTO.reviews.length} GoalReviews for Goal ${goal.uuid}`);
      for (const review of serverDTO.reviews) {
        await (this.prisma as any).goalReview.upsert({
          where: { uuid: review.uuid },
          create: {
            uuid: review.uuid,
            goalUuid: goal.uuid,
            reviewType: review.type,
            content: review.summary,
            achievements: review.achievements || null,
            challenges: review.challenges || null,
            lessonsLearned: review.improvements || null,
            nextSteps: null, // Can map from improvements if needed
            rating: review.rating,
            createdAt: new Date(review.createdAt),
            updatedAt: new Date(review.createdAt), // On initial creation, updatedAt = createdAt
          },
          update: {
            reviewType: review.type,
            content: review.summary,
            achievements: review.achievements || null,
            challenges: review.challenges || null,
            lessonsLearned: review.improvements || null,
            rating: review.rating,
            updatedAt: new Date(), // Use current time on update
          },
        });
      }
    }
  }

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Goal | null> {
    const includeOptions = options?.includeChildren
      ? {
          keyResult: {
            include: {
              goalRecord: true, // Include all GoalRecords for each KeyResult
            },
          },
          goalReview: true, // Include all GoalReviews
        }
      : undefined;

    console.log('[PrismaGoalRepository.findById] includeOptions:', JSON.stringify(includeOptions, null, 2));

    const data = await this.prisma.goal.findUnique({
      where: { uuid },
      include: includeOptions as any,
    });
    
    if (data) {
      console.log('[PrismaGoalRepository.findById] Prisma returned data:', {
        uuid: data.uuid,
        name: data.name,
        keyResultCount: (data as any).keyResult?.length || 0,
      });
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Goal[]> {
    console.log('[PrismaGoalRepository.findByAccountUuid] options:', options);
    
    const where: any = { accountUuid: accountUuid, deletedAt: null };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.folderUuid) {
      where.folderUuid = options.folderUuid;
    }
    
    // Add include options to load KeyResults and GoalRecords
    const includeOptions = options?.includeChildren
      ? {
          keyResult: {
            include: {
              goalRecord: true, // Include all GoalRecords for each KeyResult
            },
          },
        }
      : undefined;
    
    console.log('[PrismaGoalRepository.findByAccountUuid] includeOptions:', JSON.stringify(includeOptions, null, 2));
    
    const data = await this.prisma.goal.findMany({ 
      where,
      include: includeOptions as any,
    });
    
    console.log('[PrismaGoalRepository.findByAccountUuid] Prisma returned data count:', data.length);
    if (data.length > 0) {
      console.log('[PrismaGoalRepository.findByAccountUuid] First record keyResult count:', (data[0] as any)?.keyResult?.length || 0);
      if ((data[0] as any)?.keyResult?.length > 0) {
        const firstKr = (data[0] as any).keyResult[0];
        console.log('[PrismaGoalRepository.findByAccountUuid] First KeyResult goalRecord count:', firstKr?.goalRecord?.length || 0);
      }
    }
    
    const entities = data.map((d) => this.mapToEntity(d));
    console.log('[PrismaGoalRepository.findByAccountUuid] Converted entity count:', entities.length);
    console.log('[PrismaGoalRepository.findByAccountUuid] First entity KeyResults count:', entities[0]?.keyResults?.length || 0);
    
    return entities;
  }

  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const data = await this.prisma.goal.findMany({
      where: { folderUuid: folderUuid, deletedAt: null }, // Prisma automatically converts to camelCase
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.goal.delete({ where: { uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.goal.update({
      where: { uuid },
      data: { deletedAt: new Date() }, // database field
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.goal.count({ where: { uuid } });
    return count > 0;
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { status },
    });
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { folderUuid: folderUuid }, // database field
    });
  }
}


