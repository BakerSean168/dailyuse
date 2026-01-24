import type { PrismaClient, goal as PrismaGoal } from '@prisma/client';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal, KeyResult, GoalReview } from '@dailyuse/domain-server/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  // importance �?Prisma schema 涓�?String 绫诲�?
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
   * �?Prisma 妯″瀷鏄犲皠涓洪鍩熷疄�?
   * 娉ㄦ剰锛歅risma Client 鑷姩灏?@map 鐨勫瓧娈佃浆鎹�?camelCase
   */
  private mapToEntity(data: PrismaGoal & { keyResults?: any[]; keyResult?: any[]; goalReview?: any[] }): Goal {
    console.log('[PrismaGoalRepository.mapToEntity] 寮€濮嬫槧灏? Goal UUID:', data.uuid);
    console.log('[PrismaGoalRepository.mapToEntity] data.keyResults:', data.keyResults);
    console.log('[PrismaGoalRepository.mapToEntity] data.keyResult:', data.keyResult);
    console.log('[PrismaGoalRepository.mapToEntity] data.goalReview:', data.goalReview);
    
    const goal = Goal.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid, // Prisma camelCase
      name: data.name,
      description: data.description,
      color: data.color, // 鏂板瓧娈?
      feasibilityAnalysis: data.feasibilityAnalysis, // 鏂板瓧娈?(Prisma camelCase)
      motivation: data.motivation, // 鏂板瓧娈?
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

    // 鎭㈠�?KeyResults锛堝鏋滄湁�?
    // �?鏀寔 keyResults �?keyResult (鍗曞鏁伴兘鏀寔)
    const keyResultsData = data.keyResults || data.keyResult || [];
    console.log('[PrismaGoalRepository.mapToEntity] keyResultsData 闀垮害:', keyResultsData.length);
    
    if (keyResultsData.length > 0) {
      console.log('[PrismaGoalRepository.mapToEntity] 寮€濮嬫仮澶?KeyResults...');
      for (const krData of keyResultsData) {
        console.log('[PrismaGoalRepository.mapToEntity] KeyResult 鍘熷鏁版嵁:', {
          uuid: krData.uuid,
          name: krData.name,
          goalRecordCount: krData.goalRecord?.length || 0,
        });
        
        // �?浠庢暟鎹簱鎵佸钩鍖栧瓧娈垫瀯寤?KeyResult
        const keyResult = KeyResult.fromServerDTO({
          uuid: krData.uuid,
          goalUuid: data.uuid,
          name: krData.name,
          description: krData.description,
          progress: {
            valueType: krData.valueType as any,
            aggregationMethod: krData.aggregationMethod as any,
            initialValue: undefined, // 鏁版嵁搴撲腑鏆傛棤姝ゅ瓧�?
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
        
        // �?鎭㈠�?GoalRecords锛堝鏋滄湁�?
        if (krData.goalRecord && krData.goalRecord.length > 0) {
          console.log(`[PrismaGoalRepository.mapToEntity] 鎭㈠�?${krData.goalRecord.length} �?GoalRecords...`);
          for (const recordData of krData.goalRecord) {
            keyResult.addRecord({
              uuid: recordData.uuid,
              keyResultUuid: krData.uuid,
              goalUuid: data.uuid,
              value: recordData.value,  // �?鏈璁板綍鐨勭嫭绔嬪€?
              note: recordData.note,
              recordedAt: recordData.recordedAt instanceof Date 
                ? recordData.recordedAt.getTime() 
                : recordData.recordedAt,
              createdAt: recordData.createdAt instanceof Date 
                ? recordData.createdAt.getTime() 
                : recordData.createdAt,
            });
          }
          console.log(`[PrismaGoalRepository.mapToEntity] �?GoalRecords 宸叉仮澶�?;
        }
        
        goal.addKeyResult(keyResult);
        console.log('[PrismaGoalRepository.mapToEntity] KeyResult 宸叉坊鍔犲埌 Goal');
      }
    } else {
      console.log('[PrismaGoalRepository.mapToEntity] 娌℃�?KeyResults 鏁版�?);
    }

    console.log('[PrismaGoalRepository.mapToEntity] Goal 瀹炰綋鐨?keyResults 鏁伴�?', goal.keyResults?.length || 0);

    // 鎭㈠�?GoalReviews锛堝鏋滄湁�?
    const reviewsData = data.goalReview || [];
    if (reviewsData.length > 0) {
      console.log(`[PrismaGoalRepository.mapToEntity] 寮€濮嬫仮澶?${reviewsData.length} �?GoalReviews...`);
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
          keyResultSnapshots: [], // 鏆備笉鏀寔蹇�?
          reviewedAt: reviewData.createdAt instanceof Date 
            ? reviewData.createdAt.getTime() 
            : reviewData.createdAt,
          createdAt: reviewData.createdAt instanceof Date 
            ? reviewData.createdAt.getTime() 
            : reviewData.createdAt,
        });
        goal.addReview(review);
        console.log(`[PrismaGoalRepository.mapToEntity] GoalReview ${reviewData.uuid} 宸叉坊鍔犲埌 Goal`);
      }
      console.log(`[PrismaGoalRepository.mapToEntity] �?${reviewsData.length} �?GoalReviews 宸叉仮澶�?;
    } else {
      console.log('[PrismaGoalRepository.mapToEntity] 娌℃�?GoalReviews 鏁版�?);
    }

    return goal;
  }

  /**
   * 淇濆瓨棰嗗煙瀹炰綋鍒版暟鎹�?
   * 娉ㄦ剰锛氳繖閲屽鐞?camelCase (PersistenceDTO) �?snake_case (鏁版嵁搴? 鐨勬槧灏?
   * 绾ц仈淇濆瓨瀛愬疄浣擄細KeyResults �?GoalReviews
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
        accountUuid: persistence.accountUuid, // PersistenceDTO �?database
        createdAt: new Date(persistence.createdAt), // PersistenceDTO �?database
        ...data,
      },
      update: data,
    });

    // 绾ц仈淇濆�?KeyResults锛堜娇鐢?ServerDTO 鑾峰彇瀹屾暣鏁版嵁�?
    const serverDTO = goal.toServerDTO(true); // includeChildren=true
    if (serverDTO.keyResults && serverDTO.keyResults.length > 0) {
      for (const kr of serverDTO.keyResults) {
        // 闃插尽鎬ф鏌? 纭繚progress瀵硅薄瀛樺�?
        if (!kr.progress) {
          console.error(`KeyResult ${kr.uuid} has no progress data, skipping save`);
          continue;
        }

        // 闃插尽鎬ф鏌? 纭繚progress瀵硅薄瀛樺�?
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
            currentValue: kr.progress.currentValue ?? 0, // �?榛樿鍊?0 濡傛灉涓?null
            unit: kr.progress.unit || null,
            weight: kr.weight ?? 0, // �?娣诲�?weight
            order: kr.order,
            createdAt: new Date(kr.createdAt),
            updatedAt: new Date(kr.updatedAt),
            goal: {
              connect: { uuid: goal.uuid }, // 鍏宠仈鐜版湁�?Goal
            },
          },
          update: {
            name: kr.name,
            description: kr.description || null,
            valueType: kr.progress.valueType,
            aggregationMethod: kr.progress.aggregationMethod,
            targetValue: kr.progress.targetValue,
            currentValue: kr.progress.currentValue ?? 0, // �?榛樿鍊?0 濡傛灉涓?null
            unit: kr.progress.unit || null,
            weight: kr.weight ?? 0, // �?娣诲�?weight
            order: kr.order,
            updatedAt: new Date(kr.updatedAt),
          },
        });

        // 绾ц仈淇濆�?GoalRecords锛堣繘搴﹁褰曪�?
        if (kr.records && kr.records.length > 0) {
          console.log(`[PrismaGoalRepository.save] 淇濆�?${kr.records.length} �?GoalRecords for KeyResult ${kr.uuid}`);
          for (const record of kr.records) {
            await (this.prisma as any).goalRecord.upsert({
              where: { uuid: record.uuid },
              create: {
                uuid: record.uuid,
                value: record.value ?? 0,  // �?鏈璁板綍鐨勭嫭绔嬪€?
                note: record.note || null,
                recordedAt: new Date(record.recordedAt),
                createdAt: new Date(record.createdAt),
                keyResult: {
                  connect: { uuid: kr.uuid }, // �?鍏宠仈鐜版湁�?KeyResult
                },
              },
              update: {
                value: record.value ?? 0,  // �?鏈璁板綍鐨勭嫭绔嬪€?
                note: record.note || null,
                recordedAt: new Date(record.recordedAt),
              },
            });
          }
        }
      }
    }

    // 绾ц仈淇濆�?GoalReviews
    if (serverDTO.reviews && serverDTO.reviews.length > 0) {
      console.log(`[PrismaGoalRepository.save] 淇濆�?${serverDTO.reviews.length} �?GoalReviews for Goal ${goal.uuid}`);
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
            nextSteps: null, // 濡傛灉闇€瑕佸彲浠ヤ�?improvements 鏄犲�?
            rating: review.rating,
            createdAt: new Date(review.createdAt),
            updatedAt: new Date(review.createdAt), // 鍒濇鍒涘缓�?updatedAt = createdAt
          },
          update: {
            reviewType: review.type,
            content: review.summary,
            achievements: review.achievements || null,
            challenges: review.challenges || null,
            lessonsLearned: review.improvements || null,
            rating: review.rating,
            updatedAt: new Date(), // 鏇存柊鏃朵娇鐢ㄥ綋鍓嶆椂�?
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
              goalRecord: true, // �?鍖呭�?KeyResult 鐨勬墍鏈?GoalRecords
            },
          },
          goalReview: true, // �?鍖呭惈鎵€鏈?GoalReviews
        }
      : undefined;

    console.log('[PrismaGoalRepository.findById] includeOptions:', JSON.stringify(includeOptions, null, 2));

    const data = await this.prisma.goal.findUnique({
      where: { uuid },
      include: includeOptions as any,
    });
    
    if (data) {
      console.log('[PrismaGoalRepository.findById] Prisma杩斿洖鏁版嵁:', {
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
    
    // �?娣诲�?include 閫夐」浠ュ姞�?KeyResults �?GoalRecords
    const includeOptions = options?.includeChildren
      ? {
          keyResult: {
            include: {
              goalRecord: true, // �?鍖呭�?KeyResult 鐨勬墍鏈?GoalRecords
            },
          },
        }
      : undefined;
    
    console.log('[PrismaGoalRepository.findByAccountUuid] includeOptions:', JSON.stringify(includeOptions, null, 2));
    
    const data = await this.prisma.goal.findMany({ 
      where,
      include: includeOptions as any,
    });
    
    console.log('[PrismaGoalRepository.findByAccountUuid] Prisma杩斿洖鏁版嵁鏁伴�?', data.length);
    if (data.length > 0) {
      console.log('[PrismaGoalRepository.findByAccountUuid] 绗竴鏉℃暟鎹殑keyResult鏁伴�?', (data[0] as any)?.keyResult?.length || 0);
      if ((data[0] as any)?.keyResult?.length > 0) {
        const firstKr = (data[0] as any).keyResult[0];
        console.log('[PrismaGoalRepository.findByAccountUuid] 绗竴涓狵eyResult鐨刧oalRecord鏁伴�?', firstKr?.goalRecord?.length || 0);
      }
    }
    
    const entities = data.map((d) => this.mapToEntity(d));
    console.log('[PrismaGoalRepository.findByAccountUuid] 杞崲鍚庡疄浣撴暟閲?', entities.length);
    console.log('[PrismaGoalRepository.findByAccountUuid] 绗竴涓疄浣撶殑KeyResults鏁伴�?', entities[0]?.keyResults?.length || 0);
    
    return entities;
  }

  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const data = await this.prisma.goal.findMany({
      where: { folderUuid: folderUuid, deletedAt: null }, // Prisma 鑷姩杞崲�?camelCase
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


