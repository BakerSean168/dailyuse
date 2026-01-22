import type { PrismaClient, goal as PrismaGoal } from '@prisma/client';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal, KeyResult, GoalReview } from '@dailyuse/domain-server/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  // importance �?Prisma schema 中是 String 类型
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
   * �?Prisma 模型映射为领域实�?
   * 注意：Prisma Client 自动�?@map 的字段转换为 camelCase
   */
  private mapToEntity(data: PrismaGoal & { keyResults?: any[]; keyResult?: any[]; goalReview?: any[] }): Goal {
    console.log('[PrismaGoalRepository.mapToEntity] 开始映�? Goal UUID:', data.uuid);
    console.log('[PrismaGoalRepository.mapToEntity] data.keyResults:', data.keyResults);
    console.log('[PrismaGoalRepository.mapToEntity] data.keyResult:', data.keyResult);
    console.log('[PrismaGoalRepository.mapToEntity] data.goalReview:', data.goalReview);
    
    const goal = Goal.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid, // Prisma camelCase
      title: data.title,
      description: data.description,
      color: data.color, // 新字�?
      feasibilityAnalysis: data.feasibilityAnalysis, // 新字�?(Prisma camelCase)
      motivation: data.motivation, // 新字�?
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

    // 恢复 KeyResults（如果有�?
    // �?支持 keyResults �?keyResult (单复数都支持)
    const keyResultsData = data.keyResults || data.keyResult || [];
    console.log('[PrismaGoalRepository.mapToEntity] keyResultsData 长度:', keyResultsData.length);
    
    if (keyResultsData.length > 0) {
      console.log('[PrismaGoalRepository.mapToEntity] 开始恢�?KeyResults...');
      for (const krData of keyResultsData) {
        console.log('[PrismaGoalRepository.mapToEntity] KeyResult 原始数据:', {
          uuid: krData.uuid,
          title: krData.title,
          goalRecordCount: krData.goalRecord?.length || 0,
        });
        
        // �?从数据库扁平化字段构�?KeyResult
        const keyResult = KeyResult.fromServerDTO({
          uuid: krData.uuid,
          goalUuid: data.uuid,
          title: krData.title,
          description: krData.description,
          progress: {
            valueType: krData.valueType as any,
            aggregationMethod: krData.aggregationMethod as any,
            initialValue: undefined, // 数据库中暂无此字�?
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
        
        // �?恢复 GoalRecords（如果有�?
        if (krData.goalRecord && krData.goalRecord.length > 0) {
          console.log(`[PrismaGoalRepository.mapToEntity] 恢复 ${krData.goalRecord.length} �?GoalRecords...`);
          for (const recordData of krData.goalRecord) {
            keyResult.addRecord({
              uuid: recordData.uuid,
              keyResultUuid: krData.uuid,
              goalUuid: data.uuid,
              value: recordData.value,  // �?本次记录的独立�?
              note: recordData.note,
              recordedAt: recordData.recordedAt instanceof Date 
                ? recordData.recordedAt.getTime() 
                : recordData.recordedAt,
              createdAt: recordData.createdAt instanceof Date 
                ? recordData.createdAt.getTime() 
                : recordData.createdAt,
            });
          }
          console.log(`[PrismaGoalRepository.mapToEntity] �?GoalRecords 已恢复`);
        }
        
        goal.addKeyResult(keyResult);
        console.log('[PrismaGoalRepository.mapToEntity] KeyResult 已添加到 Goal');
      }
    } else {
      console.log('[PrismaGoalRepository.mapToEntity] 没有 KeyResults 数据');
    }

    console.log('[PrismaGoalRepository.mapToEntity] Goal 实体�?keyResults 数量:', goal.keyResults?.length || 0);

    // 恢复 GoalReviews（如果有�?
    const reviewsData = data.goalReview || [];
    if (reviewsData.length > 0) {
      console.log(`[PrismaGoalRepository.mapToEntity] 开始恢�?${reviewsData.length} �?GoalReviews...`);
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
          keyResultSnapshots: [], // 暂不支持快照
          reviewedAt: reviewData.createdAt instanceof Date 
            ? reviewData.createdAt.getTime() 
            : reviewData.createdAt,
          createdAt: reviewData.createdAt instanceof Date 
            ? reviewData.createdAt.getTime() 
            : reviewData.createdAt,
        });
        goal.addReview(review);
        console.log(`[PrismaGoalRepository.mapToEntity] GoalReview ${reviewData.uuid} 已添加到 Goal`);
      }
      console.log(`[PrismaGoalRepository.mapToEntity] �?${reviewsData.length} �?GoalReviews 已恢复`);
    } else {
      console.log('[PrismaGoalRepository.mapToEntity] 没有 GoalReviews 数据');
    }

    return goal;
  }

  /**
   * 保存领域实体到数据库
   * 注意：这里处�?camelCase (PersistenceDTO) �?snake_case (数据�? 的映�?
   * 级联保存子实体：KeyResults �?GoalReviews
   */
  async save(goal: Goal): Promise<void> {
    const persistence = goal.toPersistenceDTO();
    const data = {
      title: persistence.title,
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
        accountUuid: persistence.accountUuid, // PersistenceDTO �?database
        createdAt: new Date(persistence.createdAt), // PersistenceDTO �?database
        ...data,
      },
      update: data,
    });

    // 级联保存 KeyResults（使�?ServerDTO 获取完整数据�?
    const serverDTO = goal.toServerDTO(true); // includeChildren=true
    if (serverDTO.keyResults && serverDTO.keyResults.length > 0) {
      for (const kr of serverDTO.keyResults) {
        // 防御性检�? 确保progress对象存在
        if (!kr.progress) {
          console.error(`KeyResult ${kr.uuid} has no progress data, skipping save`);
          continue;
        }

        // 防御性检�? 确保progress对象存在
        if (!kr.progress) {
          console.error(`KeyResult ${kr.uuid} has no progress data, skipping save`);
          continue;
        }

        await (this.prisma as any).keyResult.upsert({
          where: { uuid: kr.uuid },
          create: {
            uuid: kr.uuid,
            title: kr.title,
            description: kr.description || null,
            valueType: kr.progress.valueType,
            aggregationMethod: kr.progress.aggregationMethod,
            targetValue: kr.progress.targetValue,
            currentValue: kr.progress.currentValue ?? 0, // �?默认�?0 如果�?null
            unit: kr.progress.unit || null,
            weight: kr.weight ?? 0, // �?添加 weight
            order: kr.order,
            createdAt: new Date(kr.createdAt),
            updatedAt: new Date(kr.updatedAt),
            goal: {
              connect: { uuid: goal.uuid }, // 关联现有�?Goal
            },
          },
          update: {
            title: kr.title,
            description: kr.description || null,
            valueType: kr.progress.valueType,
            aggregationMethod: kr.progress.aggregationMethod,
            targetValue: kr.progress.targetValue,
            currentValue: kr.progress.currentValue ?? 0, // �?默认�?0 如果�?null
            unit: kr.progress.unit || null,
            weight: kr.weight ?? 0, // �?添加 weight
            order: kr.order,
            updatedAt: new Date(kr.updatedAt),
          },
        });

        // 级联保存 GoalRecords（进度记录）
        if (kr.records && kr.records.length > 0) {
          console.log(`[PrismaGoalRepository.save] 保存 ${kr.records.length} �?GoalRecords for KeyResult ${kr.uuid}`);
          for (const record of kr.records) {
            await (this.prisma as any).goalRecord.upsert({
              where: { uuid: record.uuid },
              create: {
                uuid: record.uuid,
                value: record.value ?? 0,  // �?本次记录的独立�?
                note: record.note || null,
                recordedAt: new Date(record.recordedAt),
                createdAt: new Date(record.createdAt),
                keyResult: {
                  connect: { uuid: kr.uuid }, // �?关联现有�?KeyResult
                },
              },
              update: {
                value: record.value ?? 0,  // �?本次记录的独立�?
                note: record.note || null,
                recordedAt: new Date(record.recordedAt),
              },
            });
          }
        }
      }
    }

    // 级联保存 GoalReviews
    if (serverDTO.reviews && serverDTO.reviews.length > 0) {
      console.log(`[PrismaGoalRepository.save] 保存 ${serverDTO.reviews.length} �?GoalReviews for Goal ${goal.uuid}`);
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
            nextSteps: null, // 如果需要可以从 improvements 映射
            rating: review.rating,
            createdAt: new Date(review.createdAt),
            updatedAt: new Date(review.createdAt), // 初次创建�?updatedAt = createdAt
          },
          update: {
            reviewType: review.type,
            content: review.summary,
            achievements: review.achievements || null,
            challenges: review.challenges || null,
            lessonsLearned: review.improvements || null,
            rating: review.rating,
            updatedAt: new Date(), // 更新时使用当前时�?
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
              goalRecord: true, // �?包含 KeyResult 的所�?GoalRecords
            },
          },
          goalReview: true, // �?包含所�?GoalReviews
        }
      : undefined;

    console.log('[PrismaGoalRepository.findById] includeOptions:', JSON.stringify(includeOptions, null, 2));

    const data = await this.prisma.goal.findUnique({
      where: { uuid },
      include: includeOptions as any,
    });
    
    if (data) {
      console.log('[PrismaGoalRepository.findById] Prisma返回数据:', {
        uuid: data.uuid,
        title: data.title,
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
    
    // �?添加 include 选项以加�?KeyResults �?GoalRecords
    const includeOptions = options?.includeChildren
      ? {
          keyResult: {
            include: {
              goalRecord: true, // �?包含 KeyResult 的所�?GoalRecords
            },
          },
        }
      : undefined;
    
    console.log('[PrismaGoalRepository.findByAccountUuid] includeOptions:', JSON.stringify(includeOptions, null, 2));
    
    const data = await this.prisma.goal.findMany({ 
      where,
      include: includeOptions as any,
    });
    
    console.log('[PrismaGoalRepository.findByAccountUuid] Prisma返回数据数量:', data.length);
    if (data.length > 0) {
      console.log('[PrismaGoalRepository.findByAccountUuid] 第一条数据的keyResult数量:', (data[0] as any)?.keyResult?.length || 0);
      if ((data[0] as any)?.keyResult?.length > 0) {
        const firstKr = (data[0] as any).keyResult[0];
        console.log('[PrismaGoalRepository.findByAccountUuid] 第一个KeyResult的goalRecord数量:', firstKr?.goalRecord?.length || 0);
      }
    }
    
    const entities = data.map((d) => this.mapToEntity(d));
    console.log('[PrismaGoalRepository.findByAccountUuid] 转换后实体数�?', entities.length);
    console.log('[PrismaGoalRepository.findByAccountUuid] 第一个实体的KeyResults数量:', entities[0]?.keyResults?.length || 0);
    
    return entities;
  }

  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const data = await this.prisma.goal.findMany({
      where: { folderUuid: folderUuid, deletedAt: null }, // Prisma 自动转换�?camelCase
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

