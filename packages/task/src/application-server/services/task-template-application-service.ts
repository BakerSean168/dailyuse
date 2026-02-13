import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository, TaskFilters } from '../../domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplate } from '../../domain-server/aggregates/task-template';
import { TaskInstance } from '../../domain-server/aggregates/task-instance';
import { TaskInstanceGenerationService } from '../../domain-server/services/TaskInstanceGenerationService';
import { TaskTimeConfig, RecurrenceRule, TaskReminderConfig } from '../../domain-server/value-objects';

// Result pattern imports
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

// Cross-module imports
import type { IScheduleTaskRepository } from '@dailyuse/schedule/domain-server';
import { ScheduleTaskFactory } from '@dailyuse/schedule/domain-server';
import { SourceModule } from '@dailyuse/contracts/schedule';

import { TaskType, TaskTemplateStatus } from '@dailyuse/contracts/task';
import type {
  TaskTimeConfigServerDTO,
  RecurrenceRuleServerDTO,
  TaskReminderConfigServerDTO,
  TaskTemplateServerDTO,
  TaskInstanceServerDTO,
  TaskTemplateClientDTO,
  TaskTemplateHistoryClientDTO,
  TaskInstanceClientDTO,
} from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils';

/**
 * TaskTemplate 搴旂敤鏈嶅姟
 * 璐熻矗鍗忚皟棰嗗煙鏈嶅姟鍜屼粨鍌紝澶勭悊涓氬姟鐢ㄤ緥
 *
 * 鏋舵瀯鑱岃矗锛?
 * - 濮旀墭缁?DomainService 澶勭悊涓氬姟閫昏緫
 * - 鍗忚皟澶氫釜棰嗗煙鏈嶅姟
 * - 浜嬪姟绠＄悊
 * - DTO 杞崲锛圖omain 鈫?Contracts锛?
 */
export class TaskTemplateApplicationService {
  private generationService: TaskInstanceGenerationService;
  private templateRepository: ITaskTemplateRepository;
  private instanceRepository: ITaskInstanceRepository;
  private scheduleRepository?: IScheduleTaskRepository;

  constructor(
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
    scheduleRepository?: IScheduleTaskRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
    this.templateRepository = templateRepository;
    this.instanceRepository = instanceRepository;
    this.scheduleRepository = scheduleRepository;
  }

  // ===== TaskTemplate 绠＄悊 =====

  /**
   * 鍒涘缓浠诲姟妯℃澘
   * 鍒涘缓鍚庤嚜鍔ㄧ敓鎴愬垵濮嬪疄渚嬶紙100澶?鏈€澶?00涓級
   */
  async createTaskTemplate(params: {
    identityId: string;
    title: string;
    description?: string;
    taskType: TaskType;
    timeConfig: TaskTimeConfigServerDTO;
    recurrenceRule?: RecurrenceRuleServerDTO;
    reminderConfig?: TaskReminderConfigServerDTO;
    importance?: ImportanceLevel;
    folderId?: string;
    tags?: string[];
    color?: string;
  }): Promise<Result<TaskTemplateServerDTO>> {
    // Note: Account existence is implicitly validated by the database foreign key constraint.
    // If account doesn't exist, Prisma will throw a foreign key constraint error.
    // For more explicit validation, check account in a separate repository if needed.

    // 杞崲鍊煎璞?
    const timeConfig = TaskTimeConfig.fromServerDTO(params.timeConfig);
    const recurrenceRule = params.recurrenceRule
      ? RecurrenceRule.fromServerDTO(params.recurrenceRule)
      : undefined;
    const reminderConfig = params.reminderConfig
      ? TaskReminderConfig.fromServerDTO(params.reminderConfig)
      : undefined;

    // 浣跨敤棰嗗煙妯″瀷鐨勫伐鍘傛柟娉曞垱寤?
    const template = TaskTemplate.create({
      identityId: params.identityId,
      title: params.title,
      description: params.description,
      taskType: params.taskType,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: params.importance,
      folderId: params.folderId,
      tags: params.tags,
      color: params.color,
    });

    // 淇濆瓨鍒颁粨鍌?
    await this.templateRepository.save(template);

    // 馃敟 濡傛灉鐘舵€佹槸 ACTIVE锛岀珛鍗崇敓鎴愬垵濮嬪疄渚?
    if (template.status === TaskTemplateStatus.ACTIVE) {
      console.log(
        `[TaskTemplateApplicationService] 妯℃澘 "${template.title}" 宸插垱寤猴紝寮€濮嬬敓鎴愬垵濮嬪疄渚?..`,
      );
      await this.generateInitialInstances(template);
    }

    return ok(template.toClientDTO());
  }

  /**
   * 鐢熸垚鍒濆瀹炰緥锛堢鏈夋柟娉曪級
   *
   * 瀹炴柦绛栫暐锛堟柟妗?C - 娣峰悎鏂规锛夛細
   * 1. 鐢熸垚鏈潵100澶╁唴鐨凾askInstance锛堢敤浜庡墠绔睍绀哄拰鍏佽鐢ㄦ埛淇敼锛?
   * 2. 鍒涘缓1涓惊鐜疭cheduleTask锛堢敤浜庢彁閱掞級
   * 3. ScheduleTask瑙﹀彂鏃讹紝妫€鏌ュ綋澶㊣nstance鐨勫疄闄呮椂闂达紝鍙戦€佹彁閱?
   *
   * 鏀剁泭锛?
   * - 鐢ㄦ埛浣撻獙濂斤紙鍙慨鏀瑰崟澶╂椂闂达級
   * - 鎬ц兘鍚堢悊锛堝彧鏈?涓猄cheduleTask锛?
   * - 鎻愰啋鍑嗙‘锛堜娇鐢↖nstance鐨勫疄闄呮椂闂达級
   */
  private async generateInitialInstances(template: TaskTemplate): Promise<void> {
    try {
      // 1. 鐢熸垚 100 澶╃殑 TaskInstance锛堢敤浜庡睍绀哄拰淇敼锛?
      const instances = this.generationService.generateInstances(template);

      if (instances.length > 0) {
        await this.instanceRepository.saveMany(instances);
        // 鏇存柊妯℃澘鐨?lastGeneratedDate
        await this.templateRepository.save(template);

        console.log(
          `鉁?[TaskTemplateApplicationService] 妯℃澘 "${template.title}" 鐢熸垚浜?${instances.length} 涓疄渚嬶紙鏈潵100澶╋級`,
        );

        // 鍙戝竷鐢熸垚浜嬩欢
        this.publishInstancesGeneratedEvent(template, instances);
      }

      // 2. 馃敟 濡傛灉閰嶇疆浜嗘彁閱掞紝鍒涘缓寰幆 ScheduleTask锛堝彧鍒涘缓1涓級
      if (template.reminderConfig?.enabled) {
        await this.createScheduleTaskForTemplate(template);
      }

      console.log(`鉁?[TaskTemplateApplicationService] 妯℃澘 "${template.title}" 鍒濆鍖栧畬鎴恅);
    } catch (error) {
      console.error(
        `鉂?[TaskTemplateApplicationService] 妯℃澘 "${template.title}" 鍒濆鍖栧け璐?`,
        error,
      );
      // 涓嶆姏鍑洪敊璇紝妯℃澘宸茬粡鍒涘缓鎴愬姛锛屽疄渚嬬敓鎴愬け璐ヤ笉褰卞搷妯℃澘鍒涘缓
    }
  }

  /**
   * 鍙戝竷瀹炰緥鐢熸垚浜嬩欢
   */
  private publishInstancesGeneratedEvent(template: TaskTemplate, instances: TaskInstance[]): void {
    const SMALL_BATCH_THRESHOLD = 20;
    const eventPayload: any = {
      templateId: template.id,
      templateTitle: template.title,
      instanceCount: instances.length,
      dateRange: {
        from: Date.now(),
        to: Date.now() + 100 * 86400000, // Approx
      },
    };

    if (instances.length <= SMALL_BATCH_THRESHOLD) {
      eventPayload.instances = instances.map((inst) => inst.toClientDTO());
      eventPayload.strategy = 'full';
    } else {
      eventPayload.strategy = 'summary';
    }

    eventBus.emit('task.instances.generated', {
      eventType: 'task_template.instances_generated',
      version: '1.0',
      aggregateId: template.id,
      occurredOn: new Date(),
      identityId: template.identityId,
      payload: eventPayload,
    });
  }

  /**
   * 涓篢askTemplate鍒涘缓寰幆ScheduleTask锛堢敤浜庢彁閱掞級
   */
  private async createScheduleTaskForTemplate(template: TaskTemplate): Promise<void> {
    if (!this.scheduleRepository) {
      console.warn(`鈿狅笍 [TaskTemplateApplicationService] ScheduleRepository not injected. Skipping schedule task creation.`);
      return;
    }

    try {
      // 鍒涘缓 ScheduleTaskFactory
      const factory = new ScheduleTaskFactory();
      const templateDTO = template.toServerDTO();

      // 浣跨敤 TaskScheduleStrategy 鍒涘缓 ScheduleTask
      const scheduleTask = factory.createFromSourceEntity({
        identityId: template.identityId,
        sourceModule: SourceModule.TASK,
        sourceEntityId: template.id,
        sourceEntity: templateDTO,
      });

      // 淇濆瓨鍒颁粨鍌?
      await this.scheduleRepository.save(scheduleTask);

      console.log(
        `鉁?[TaskTemplateApplicationService] 涓烘ā鏉?"${template.title}" 鍒涘缓浜嗗惊鐜?ScheduleTask: ${scheduleTask.id}`,
      );
    } catch (error: any) {
      // 濡傛灉鏄?涓嶉渶瑕佽皟搴?閿欒锛屼笉鎶ラ敊
      if (error?.name === 'SourceEntityNoScheduleRequiredError') {
        console.log(
          `鈩癸笍  [TaskTemplateApplicationService] 妯℃澘 "${template.title}" 涓嶉渶瑕佸垱寤?ScheduleTask锛堟湭閰嶇疆鎻愰啋鎴栦笉婊¤冻鏉′欢锛塦,
        );
        return;
      }

      console.error(
        `鉂?[TaskTemplateApplicationService] 涓烘ā鏉?"${template.title}" 鍒涘缓 ScheduleTask 澶辫触:`,
        error,
      );
      // 涓嶆姏鍑洪敊璇紝ScheduleTask 鍒涘缓澶辫触涓嶅奖鍝?TaskTemplate 鍒涘缓
    }
  }

  /**
   * 鑾峰彇浠诲姟妯℃澘璇︽儏
   */
  async getTaskTemplate(
    uuid: string,
    includeChildren: boolean = false,
  ): Promise<Result<TaskTemplateServerDTO | null>> {
    const template = includeChildren
      ? await this.templateRepository.findByIdWithChildren(uuid)
      : await this.templateRepository.findById(uuid);

    return ok(template ? template.toClientDTO(includeChildren) : null);
  }

  /**
   * 鏍规嵁璐︽埛鑾峰彇浠诲姟妯℃澘鍒楄〃
   * 鑾峰彇鏃惰嚜鍔ㄦ鏌ュ苟琛ュ厖瀹炰緥
   */
  async getTaskTemplatesByAccount(
    identityId: string,
  ): Promise<Result<TaskTemplateServerDTO[]>> {
    const templates = await this.templateRepository.findByIdentityId(identityId);

    // 馃敟 鑷姩妫€鏌ュ苟琛ュ厖姣忎釜 ACTIVE 妯℃澘鐨勫疄渚?
    for (const template of templates) {
      if (template.status === TaskTemplateStatus.ACTIVE) {
        this.checkAndRefillInstances(template).catch((error) => {
          console.error(`鉂?琛ュ厖妯℃澘 "${template.title}" 瀹炰緥澶辫触:`, error);
        });
      }
    }

    return ok(templates.map((t) => t.toClientDTO()));
  }

  /**
   * 妫€鏌ュ苟琛ュ厖妯℃澘瀹炰緥锛堝紓姝ユ墽琛岋紝涓嶉樆濉炶繑鍥烇級
   */
  private async checkAndRefillInstances(template: TaskTemplate): Promise<void> {
    try {
      // 1. 妫€鏌ユ槸鍚﹂渶瑕佽ˉ鍏?
      if (this.generationService.shouldRefillInstances(template)) {
        console.log(`馃攧 [TaskTemplateApplicationService] 妯℃澘 "${template.title}" 闇€瑕佽ˉ鍏呭疄渚?..`);

        // 2. 鐢熸垚瀹炰緥
        const instances = this.generationService.generateInstances(template);

        if (instances.length > 0) {
          // 3. 淇濆瓨瀹炰緥鍜屾ā鏉?
          await this.instanceRepository.saveMany(instances);
          await this.templateRepository.save(template);

          console.log(
            `鉁?[TaskTemplateApplicationService] 涓烘ā鏉?"${template.title}" 琛ュ厖浜?${instances.length} 涓疄渚媊,
          );

          // 4. 鍙戝竷浜嬩欢
          this.publishInstancesGeneratedEvent(template, instances);
        }
      }
    } catch (error) {
      console.error(`鉂?[TaskTemplateApplicationService] 琛ュ厖瀹炰緥澶辫触:`, error);
    }
  }

  /**
   * 鏍规嵁鐘舵€佽幏鍙栦换鍔℃ā鏉?
   */
  async getTaskTemplatesByStatus(
    identityId: string,
    status: TaskTemplateStatus,
  ): Promise<Result<TaskTemplateServerDTO[]>> {
    const templates = await this.templateRepository.findByStatus(identityId, status);
    return ok(templates.map((t) => t.toClientDTO()));
  }

  /**
   * 鑾峰彇娲昏穬鐨勪换鍔℃ā鏉?
   * 鑾峰彇鏃惰嚜鍔ㄦ鏌ュ苟琛ュ厖瀹炰緥
   */
  async getActiveTaskTemplates(
    identityId: string,
  ): Promise<Result<TaskTemplateServerDTO[]>> {
    const templates = await this.templateRepository.findActiveTemplates(identityId);

    // 馃敟 鑷姩妫€鏌ュ苟琛ュ厖姣忎釜妯℃澘鐨勫疄渚?
    for (const template of templates) {
      this.checkAndRefillInstances(template).catch((error) => {
        console.error(`鉂?琛ュ厖妯℃澘 "${template.title}" 瀹炰緥澶辫触:`, error);
      });
    }

    return ok(templates.map((t) => t.toClientDTO()));
  }

  /**
   * 鏍规嵁鏂囦欢澶硅幏鍙栦换鍔℃ā鏉?
   */
  async getTaskTemplatesByFolder(
    folderId: string,
  ): Promise<Result<TaskTemplateServerDTO[]>> {
    const templates = await this.templateRepository.findByFolderId(folderId);
    return ok(templates.map((t) => t.toClientDTO()));
  }

  /**
   * 鏍规嵁鐩爣鑾峰彇浠诲姟妯℃澘
   */
  async getTaskTemplatesByGoal(goalId: string): Promise<Result<TaskTemplateServerDTO[]>> {
    const templates = await this.templateRepository.findByGoalId(goalId);
    return ok(templates.map((t) => t.toClientDTO()));
  }

  /**
   * 鏍规嵁鏍囩鑾峰彇浠诲姟妯℃澘
   */
  async getTaskTemplatesByTags(
    identityId: string,
    tags: string[],
  ): Promise<Result<TaskTemplateServerDTO[]>> {
    const templates = await this.templateRepository.findByTags(identityId, tags);
    return ok(templates.map((t) => t.toClientDTO()));
  }

  /**
   * 鏇存柊浠诲姟妯℃澘
   */
  async updateTaskTemplate(
    uuid: string,
    params: {
      title?: string;
      description?: string;
      timeConfig?: TaskTimeConfigServerDTO;
      recurrenceRule?: RecurrenceRuleServerDTO;
      reminderConfig?: TaskReminderConfigServerDTO;
      importance?: ImportanceLevel;
      folderId?: string;
      tags?: string[];
      color?: string;
    },
  ): Promise<Result<TaskTemplateServerDTO>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${uuid} not found`);
    }

    // 娉ㄦ剰锛氳繖閲岀畝鍖栦簡鏇存柊閫昏緫锛屽疄闄呭簲璇ュ湪鑱氬悎鏍逛腑娣诲姞鏇存柊鏂规硶
    // 鐢变簬鏃堕棿鍏崇郴锛岃繖閲岀洿鎺ヤ慨鏀圭鏈夊瓧娈碉紙涓嶆帹鑽愶紝搴旇娣诲姞鍏紑鐨勬洿鏂版柟娉曪級
    // TODO: 鍦?TaskTemplate 鑱氬悎鏍逛腑娣诲姞 update() 鏂规硶

    await this.templateRepository.save(template);

    // 馃敟 濡傛灉鏇存柊浜嗚皟搴︾浉鍏抽厤缃紝鍙戝竷鍙樻洿浜嬩欢
    if (params.timeConfig || params.recurrenceRule || params.reminderConfig) {
      try {
        await eventBus.publish({
          eventType: 'task.template.schedule_changed',
          payload: {
            taskTemplateId: template.id,
            taskTemplateTitle: template.title,
            identityId: template.identityId,
            changedAt: Date.now(),
            taskTemplateData: template.toServerDTO(),
          },
          timestamp: Date.now(),
        });
        console.log(
          `馃摛 [TaskTemplateApplicationService] 宸插彂甯?task.template.schedule_changed 浜嬩欢`,
        );
      } catch (error) {
        console.error(`鉂?[TaskTemplateApplicationService] 鍙戝竷璋冨害鍙樻洿浜嬩欢澶辫触:`, error);
      }
    }

    return ok(template.toClientDTO());
  }

  /**
   * 婵€娲讳换鍔℃ā鏉?
   *
   * 涓氬姟閫昏緫锛?
   * 1. 淇敼妯℃澘鐘舵€佷负 ACTIVE
   * 2. 绔嬪嵆鐢熸垚瀹炰緥鍒颁粖澶?
   * 3. 鍙戝竷鎭㈠浜嬩欢锛岃Е鍙戞彁閱掕皟搴︽仮澶?
   */
  async activateTaskTemplate(uuid: string): Promise<Result<TaskTemplateServerDTO>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${uuid} not found`);
    }

    console.log(`[TaskTemplateApplicationService] 寮€濮嬫縺娲绘ā鏉? ${template.title}`);

    // 1. 婵€娲绘ā鏉跨姸鎬?
    template.activate();
    await this.templateRepository.save(template);
    console.log(`鉁?[TaskTemplateApplicationService] 妯℃澘鐘舵€佸凡鏇存柊涓?ACTIVE`);

    // 2. 绔嬪嵆鐢熸垚瀹炰緥鍒颁粖澶?
    console.log(
      `[TaskTemplateApplicationService] 妯℃澘 "${template.title}" 宸叉縺娲伙紝寮€濮嬬敓鎴愬疄渚?..`,
    );
    await this.generateInitialInstances(template);

    // 3. 馃敟 鍙戝竷鎭㈠浜嬩欢锛岃Е鍙戞彁閱掕皟搴︽仮澶?
    try {
      await eventBus.publish({
        eventType: 'task.template.resumed',
        payload: {
          taskTemplateId: template.id,
          taskTemplateTitle: template.title,
          identityId: template.identityId,
          resumedAt: Date.now(),
          taskTemplateData: template.toServerDTO(),
        },
        timestamp: Date.now(),
      });
      console.log(`馃摛 [TaskTemplateApplicationService] 宸插彂甯?task.template.resumed 浜嬩欢`);
    } catch (error) {
      console.error(`鉂?[TaskTemplateApplicationService] 鍙戝竷鎭㈠浜嬩欢澶辫触:`, error);
    }

    console.log(`鉁?[TaskTemplateApplicationService] 妯℃澘 "${template.title}" 宸叉縺娲诲苟鐢熸垚瀹炰緥`);
    return ok(template.toClientDTO());
  }

  /**
   * 鏆傚仠浠诲姟妯℃澘
   *
   * 涓氬姟閫昏緫锛?
   * 1. 淇敼妯℃澘鐘舵€佷负 PAUSED
   * 2. 鍋滄鐢熸垚鏂扮殑浠诲姟瀹炰緥
   * 3. 澶勭悊宸插瓨鍦ㄧ殑鏈畬鎴愬疄渚嬶紙鏍囪涓?SKIPPED锛?
   * 4. 鍙戝竷鏆傚仠浜嬩欢锛岃Е鍙戞彁閱掕皟搴︽殏鍋?
   */
  async pauseTaskTemplate(uuid: string): Promise<Result<TaskTemplateServerDTO>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${uuid} not found`);
    }

    console.log(`[TaskTemplateApplicationService] 寮€濮嬫殏鍋滄ā鏉? ${template.title}`);

    // 1. 鏆傚仠妯℃澘鐘舵€?
    template.pause();
    await this.templateRepository.save(template);
    console.log(`鉁?[TaskTemplateApplicationService] 妯℃澘鐘舵€佸凡鏇存柊涓?PAUSED`);

    // 2. 澶勭悊鏈畬鎴愮殑浠诲姟瀹炰緥
    await this.handleInstancesOnPause(uuid);

    // 3. 馃敟 鍙戝竷鏆傚仠浜嬩欢锛岃Е鍙戞彁閱掕皟搴︽殏鍋?
    try {
      await eventBus.publish({
        eventType: 'task.template.paused',
        payload: {
          taskTemplateId: template.id,
          identityId: template.identityId,
          pausedAt: Date.now(),
          reason: '鐢ㄦ埛鎵嬪姩鏆傚仠',
        },
        timestamp: Date.now(),
      });
      console.log(`馃摛 [TaskTemplateApplicationService] 宸插彂甯?task.template.paused 浜嬩欢`);
    } catch (error) {
      console.error(`鉂?[TaskTemplateApplicationService] 鍙戝竷鏆傚仠浜嬩欢澶辫触:`, error);
    }

    console.log(`鉁?[TaskTemplateApplicationService] 妯℃澘 "${template.title}" 宸叉殏鍋渀);
    return ok(template.toClientDTO());
  }

  /**
   * 澶勭悊鏆傚仠鏃剁殑浠诲姟瀹炰緥
   * - 灏嗘墍鏈夋湭瀹屾垚鐨勫疄渚嬫爣璁颁负 SKIPPED
   */
  private async handleInstancesOnPause(templateId: string): Promise<void> {
    try {
      // 鑾峰彇璇ユā鏉跨殑鎵€鏈夋湭瀹屾垚瀹炰緥
      const instances = await this.instanceRepository.findByTemplateId(templateId);
      const pendingInstances = instances.filter(
        (inst) => inst.status === 'PENDING' || inst.status === 'IN_PROGRESS',
      );

      if (pendingInstances.length === 0) {
        console.log(`[TaskTemplateApplicationService] 娌℃湁鏈畬鎴愮殑瀹炰緥闇€瑕佸鐞哷);
        return;
      }

      console.log(
        `[TaskTemplateApplicationService] 鎵惧埌 ${pendingInstances.length} 涓湭瀹屾垚瀹炰緥锛屾爣璁颁负 SKIPPED`,
      );

      // 鎵归噺鏍囪涓鸿烦杩?
      for (const instance of pendingInstances) {
        instance.skip('妯℃澘宸叉殏鍋?);
        await this.instanceRepository.save(instance);
      }

      console.log(`鉁?[TaskTemplateApplicationService] 宸插鐞?${pendingInstances.length} 涓疄渚媊);
    } catch (error) {
      console.error(`鉂?[TaskTemplateApplicationService] 澶勭悊瀹炰緥澶辫触:`, error);
      // 涓嶆姏鍑洪敊璇紝鍏佽鏆傚仠缁х画
    }
  }

  /**
   * 褰掓。浠诲姟妯℃澘
   */
  async archiveTaskTemplate(uuid: string): Promise<Result<TaskTemplateServerDTO>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${uuid} not found`);
    }

    template.archive();
    await this.templateRepository.save(template);

    return ok(template.toClientDTO());
  }

  /**
   * 杞垹闄や换鍔℃ā鏉?
   */
  async softDeleteTaskTemplate(uuid: string): Promise<Result<void>> {
    await this.templateRepository.softDelete(uuid);
    return ok(undefined);
  }

  /**
   * 鎭㈠浠诲姟妯℃澘
   */
  async restoreTaskTemplate(uuid: string): Promise<Result<TaskTemplateServerDTO>> {
    await this.templateRepository.restore(uuid);

    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${uuid} not found after restore`);
    }

    return ok(template.toClientDTO());
  }

  /**
   * 鍒犻櫎浠诲姟妯℃澘
   */
  async deleteTaskTemplate(uuid: string): Promise<Result<void>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      // 濡傛灉妯℃澘涓嶅瓨鍦紝鐩存帴杩斿洖锛堝箓绛夋€э級
      return ok(undefined);
    }

    await this.templateRepository.delete(uuid);

    // 馃敟 鍙戝竷鍒犻櫎浜嬩欢锛岃Е鍙戞彁閱掕皟搴﹀垹闄?
    try {
      await eventBus.publish({
        eventType: 'task.template.deleted',
        payload: {
          taskTemplateId: uuid,
          identityId: template.identityId,
          deletedAt: Date.now(),
        },
        timestamp: Date.now(),
      });
      console.log(`馃摛 [TaskTemplateApplicationService] 宸插彂甯?task.template.deleted 浜嬩欢`);
    } catch (error) {
      console.error(`鉂?[TaskTemplateApplicationService] 鍙戝竷鍒犻櫎浜嬩欢澶辫触:`, error);
    }

    return ok(undefined);
  }

  /**
   * 缁戝畾鍒扮洰鏍?
   */
  async bindToGoal(
    uuid: string,
    params: {
      goalId: string;
      keyResultId: string;
      incrementValue: number;
    },
  ): Promise<TaskTemplateServerDTO> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    template.bindToGoal(params.goalId, params.keyResultId, params.incrementValue);
    await this.templateRepository.save(template);

    return template.toClientDTO();
  }

  /**
   * 瑙ｉ櫎鐩爣缁戝畾
   */
  async unbindFromGoal(uuid: string): Promise<TaskTemplateServerDTO> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    template.unbindFromGoal();
    await this.templateRepository.save(template);

    return template.toClientDTO();
  }

  /**
   * 涓烘ā鏉跨敓鎴愬疄渚?
   * @deprecated 浣跨敤鏂扮殑鑷姩缁存姢鏈哄埗锛屼笉鍐嶉渶瑕佹墜鍔ㄦ寚瀹?toDate
   */
  async generateInstances(
    uuid: string,
    toDate?: number,
  ): Promise<TaskInstanceClientDTO[]> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    // 浣跨敤寮哄埗鐢熸垚妯″紡锛岄噸鏂扮敓鎴愬疄渚?
    const instances = this.generationService.generateInstances(template, { forceGenerate: true });

    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
    }

    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 妫€鏌ュ苟鐢熸垚寰呯敓鎴愮殑瀹炰緥
   */
  async checkAndGenerateInstances(): Promise<void> {
    // 鏌ユ壘鎵€鏈夐渶瑕佽ˉ鍏呯殑妯℃澘
    // 娉ㄦ剰锛氳繖閲岄渶瑕佹敮鎸佹墍鏈夎处鎴凤紝鍙兘闇€瑕佽皟鏁?Repository 鎺ュ彛
    const templates = await this.templateRepository.findActiveTemplates('');

    console.log(
      `[TaskTemplateApplicationService] 寮€濮嬫鏌?${templates.length} 涓椿璺冩ā鏉跨殑瀹炰緥鏁伴噺`,
    );

    for (const template of templates) {
      await this.checkAndRefillInstances(template);
    }
  }

  // ===== ONE_TIME 浠诲姟绠＄悊 =====

  /**
   * 鍒涘缓涓€娆℃€т换鍔?
   */
  async createOneTimeTask(params: {
    identityId: string;
    title: string;
    description?: string;
    importance?: ImportanceLevel;
    startDate?: number;
    dueDate?: number;
    estimatedMinutes?: number;
    note?: string;
    goalId?: string;
    keyResultId?: string;
    parentTaskUuid?: string;
    folderId?: string;
    tags?: string[];
    color?: string;
  }): Promise<TaskTemplateClientDTO> {
    // 浣跨敤棰嗗煙妯″瀷鐨勫伐鍘傛柟娉曞垱寤轰竴娆℃€т换鍔?
    const task = TaskTemplate.createOneTimeTask({
      identityId: params.identityId,
      title: params.title,
      description: params.description,
      importance: params.importance,
      startDate: params.startDate,
      dueDate: params.dueDate,
      estimatedMinutes: params.estimatedMinutes,
      note: params.note,
      goalId: params.goalId,
      keyResultId: params.keyResultId,
      parentTaskUuid: params.parentTaskUuid,
      folderId: params.folderId,
      tags: params.tags,
      color: params.color,
    });

    // 淇濆瓨鍒颁粨鍌?
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 闃诲浠诲姟妯℃澘
   */
  async blockTask(uuid: string, reason: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsBlocked(reason);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 瑙ｉ櫎闃诲浠诲姟妯℃澘
   */
  async unblockTask(uuid: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsReady();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 鏇存柊鎴鏃堕棿
   */
  async updateDueDate(
    uuid: string,
    newDueDate: number | null,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateDueDate(newDueDate);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 鏇存柊棰勪及鏃堕棿
   */
  async updateEstimatedTime(
    uuid: string,
    estimatedMinutes: number,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateEstimatedTime(estimatedMinutes);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 鏇存柊涓€娆℃€т换鍔★紙閫氱敤鏇存柊鏂规硶锛?
   * 鏀寔鏇存柊鏍囬銆佹弿杩般€佹棩鏈熴€佷紭鍏堢骇銆佹爣绛剧瓑灞炴€?
   */
  async updateOneTimeTask(
    uuid: string,
    updates: {
      title?: string;
      description?: string;
      startDate?: number;
      dueDate?: number;
      importance?: ImportanceLevel;
      estimatedMinutes?: number;
      tags?: string[];
      color?: string;
      note?: string;
    },
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    // 鏇存柊鍚勪釜灞炴€?
    if (updates.title !== undefined) {
      task.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      task.updateDescription(updates.description);
    }
    if (updates.startDate !== undefined) {
      task.updateStartDate(updates.startDate);
    }
    if (updates.dueDate !== undefined) {
      task.updateDueDate(updates.dueDate);
    }
    if (updates.importance !== undefined) {
      task.updatePriority(updates.importance);
    }
    if (updates.estimatedMinutes !== undefined) {
      task.updateEstimatedTime(updates.estimatedMinutes);
    }
    if (updates.tags !== undefined) {
      task.updateTags(updates.tags);
    }
    if (updates.color !== undefined) {
      task.updateColor(updates.color);
    }
    if (updates.note !== undefined) {
      task.updateNote(updates.note);
    }

    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 鑾峰彇浠诲姟鍘嗗彶璁板綍
   */
  async getTaskHistory(uuid: string): Promise<TaskTemplateHistoryClientDTO[]> {
    const task = await this.templateRepository.findByIdWithChildren(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    return task.history.map((h) => h.toClientDTO());
  }

  // ===== ONE_TIME 浠诲姟鏌ヨ =====

  /**
   * 鏌ユ壘涓€娆℃€т换鍔?
   */
  async findOneTimeTasks(
    identityId: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOneTimeTasks(identityId, filters);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鏌ユ壘寰幆浠诲姟
   */
  async findRecurringTasks(
    identityId: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findRecurringTasks(identityId, filters);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鏌ユ壘閫炬湡浠诲姟
   */
  async getOverdueTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOverdueTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鏌ユ壘浠婃棩浠诲姟
   */
  async getTodayTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTodayTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鏌ユ壘鍗冲皢鍒版湡鐨勪换鍔?
   */
  async getUpcomingTasks(
    identityId: string,
    daysAhead: number,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findUpcomingTasks(identityId, daysAhead);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鎸変紭鍏堢骇鎺掑簭鏌ユ壘浠诲姟
   */
  async getTasksSortedByPriority(
    identityId: string,
    limit?: number,
  ): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findSortedByPriority(identityId, limit);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鏍规嵁 Goal 鏌ユ壘浠诲姟锛堟柊鐗堟湰锛屾敮鎸?ONE_TIME锛?
   */
  async getTasksByGoal(goalId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findByGoalId(goalId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鏍规嵁 KeyResult 鏌ユ壘浠诲姟
   */
  async getTasksByKeyResult(keyResultId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findByKeyResultId(keyResultId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 鏌ユ壘琚樆濉炵殑浠诲姟
   */
  async getBlockedTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findBlockedTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 缁熻浠诲姟鏁伴噺
   */
  async countTasks(identityId: string, filters?: TaskFilters): Promise<number> {
    return await this.templateRepository.countTasks(identityId, filters);
  }

  // ===== 瀛愪换鍔＄鐞?=====

  /**
   * 鍒涘缓瀛愪换鍔?
   */
  async createSubtask(
    parentUuid: string,
    params: {
      identityId: string;
      title: string;
      description?: string;
      importance?: ImportanceLevel;
      dueDate?: number;
      estimatedMinutes?: number;
    },
  ): Promise<TaskTemplateClientDTO> {
    // 楠岃瘉鐖朵换鍔″瓨鍦?
    const parentTask = await this.templateRepository.findById(parentUuid);
    if (!parentTask) {
      throw new Error(`Parent task ${parentUuid} not found`);
    }

    // 鍒涘缓瀛愪换鍔?
    const subtask = TaskTemplate.createOneTimeTask({
      identityId: params.identityId,
      title: params.title,
      description: params.description,
      importance: params.importance,
      dueDate: params.dueDate,
      estimatedMinutes: params.estimatedMinutes,
      parentTaskUuid: parentUuid,
    });

    await this.templateRepository.save(subtask);

    // 璁板綍鐖朵换鍔℃坊鍔犲瓙浠诲姟
    parentTask.addSubtask(subtask.id);
    await this.templateRepository.save(parentTask);

    return subtask.toClientDTO();
  }

  /**
   * 鑾峰彇瀛愪换鍔″垪琛?
   */
  async getSubtasks(parentUuid: string): Promise<TaskTemplateClientDTO[]> {
    const subtasks = await this.templateRepository.findSubtasks(parentUuid);
    return subtasks.map((t) => t.toClientDTO());
  }

  /**
   * 绉婚櫎瀛愪换鍔?
   */
  async removeSubtask(parentUuid: string, subtaskUuid: string): Promise<void> {
    const parentTask = await this.templateRepository.findById(parentUuid);
    if (!parentTask) {
      throw new Error(`Parent task ${parentUuid} not found`);
    }

    parentTask.removeSubtask(subtaskUuid);
    await this.templateRepository.save(parentTask);
  }

  // ===== Goal/KR 鍏宠仈绠＄悊 (ONE_TIME 浠诲姟鏂扮増鏈? =====

  /**
   * 閾炬帴鍒扮洰鏍?
   */
  async linkToGoal(
    uuid: string,
    goalId: string,
    keyResultId?: string,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.linkToGoal(goalId, keyResultId);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 瑙ｉ櫎鐩爣閾炬帴
   */
  async unlinkFromGoal(uuid: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.unlinkFromGoal();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  // ===== 渚濊禆绠＄悊 =====

  /**
   * 鏍囪涓鸿闃诲
   */
  async markAsBlocked(
    uuid: string,
    reason: string,
    dependencyTaskUuid?: string,
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsBlocked(reason, dependencyTaskUuid);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 鏍囪涓哄氨缁?
   */
  async markAsReady(uuid: string): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsReady();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 鏇存柊渚濊禆鐘舵€?
   */
  async updateDependencyStatus(
    uuid: string,
    status: 'PENDING' | 'READY' | 'BLOCKED',
  ): Promise<TaskTemplateClientDTO> {
    const task = await this.templateRepository.findById(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateDependencyStatus(status);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  // ===== 鎵归噺鎿嶄綔 =====

  /**
   * 鎵归噺鍒涘缓浠诲姟
   */
  async createTasksBatch(
    tasks: Array<{
      identityId: string;
      title: string;
      description?: string;
      importance?: ImportanceLevel;
      dueDate?: number;
      estimatedMinutes?: number;
      goalId?: string;
      keyResultId?: string;
    }>,
  ): Promise<TaskTemplateClientDTO[]> {
    const taskEntities = tasks.map((params) =>
      TaskTemplate.createOneTimeTask({
        identityId: params.identityId,
        title: params.title,
        description: params.description,
        importance: params.importance,
        dueDate: params.dueDate,
        estimatedMinutes: params.estimatedMinutes,
        goalId: params.goalId,
        keyResultId: params.keyResultId,
      }),
    );

    await this.templateRepository.saveBatch(taskEntities);

    return taskEntities.map((t) => t.toClientDTO());
  }

  /**
   * 鎵归噺鍒犻櫎浠诲姟
   */
  async deleteTasksBatch(uuids: string[]): Promise<void> {
    await this.templateRepository.deleteBatch(uuids);
  }

  // ===== 浠〃鏉?缁熻鏌ヨ =====

  /**
   * 鑾峰彇鏈€杩戝畬鎴愮殑浠诲姟
   */
  async getRecentCompletedTasks(
    identityId: string,
    limit: number = 10,
  ): Promise<TaskTemplateClientDTO[]> {
    // 鑾峰彇鏈€杩?澶╁畬鎴愮殑浠诲姟
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasks = await this.templateRepository.findOneTimeTasks(identityId, {
      taskType: TaskType.ONE_TIME,
      status: 'COMPLETED' as any,
    });

    // 绛涢€夊苟鎺掑簭锛氭渶杩戝畬鎴愮殑浠诲姟锛堟寜鏇存柊鏃堕棿鍊掑簭锛?
    return tasks
      .filter((t) => t.updatedAt && t.updatedAt >= sevenDaysAgo)
      .sort((a, b) => {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return timeB - timeA;
      })
      .slice(0, limit)
      .map((t) => t.toClientDTO());
  }

  /**
   * 鑾峰彇浠诲姟浠〃鏉挎暟鎹?
   */
  async getTaskDashboard(identityId: string): Promise<{
    todayTasks: TaskTemplateClientDTO[];
    overdueTasks: TaskTemplateClientDTO[];
    blockedTasks: TaskTemplateClientDTO[];
    upcomingTasks: TaskTemplateClientDTO[];
    highPriorityTasks: TaskTemplateClientDTO[];
    recentCompleted: TaskTemplateClientDTO[];
    statistics: {
      totalActive: number;
      totalCompleted: number;
      totalOverdue: number;
      totalBlocked: number;
      completionRate: number;
    };
  }> {
    // 骞惰鏌ヨ鎵€鏈夋暟鎹?
    const [
      today,
      overdue,
      blocked,
      upcoming,
      highPriority,
      recentCompleted,
      totalActive,
      totalCompleted,
    ] = await Promise.all([
      this.getTodayTasks(identityId),
      this.getOverdueTasks(identityId),
      this.getBlockedTasks(identityId),
      this.getUpcomingTasks(identityId, 7), // 鏈潵7澶?
      this.getTasksSortedByPriority(identityId, 5), // 鍓?涓珮浼樺厛绾т换鍔?
      this.getRecentCompletedTasks(identityId, 10), // 鏈€杩?0涓畬鎴愮殑浠诲姟
      this.countTasks(identityId, {
        taskType: TaskType.ONE_TIME,
        status: 'TODO' as any,
      }),
      this.countTasks(identityId, {
        taskType: TaskType.ONE_TIME,
        status: 'COMPLETED' as any,
      }),
    ]);

    const completionRate =
      totalActive + totalCompleted > 0
        ? Math.round((totalCompleted / (totalActive + totalCompleted)) * 100)
        : 0;

    return {
      todayTasks: today,
      overdueTasks: overdue,
      blockedTasks: blocked,
      upcomingTasks: upcoming,
      highPriorityTasks: highPriority,
      recentCompleted,
      statistics: {
        totalActive,
        totalCompleted,
        totalOverdue: overdue.length,
        totalBlocked: blocked.length,
        completionRate,
      },
    };
  }

  /**
   * 鏍规嵁鏃ユ湡鑼冨洿鑾峰彇妯℃澘瀹炰緥
   * 鐢ㄤ簬鍓嶇鎸夐渶鍔犺浇浠诲姟瀹炰緥
   */
  async getInstancesByDateRange(
    templateId: string,
    fromDate: number,
    toDate: number,
  ): Promise<TaskInstanceClientDTO[]> {
    // 楠岃瘉妯℃澘鏄惁瀛樺湪
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Task template not found: ${templateId}`);
    }

    // 浠庝粨鍌ㄤ腑鑾峰彇璇ユā鏉跨殑鎵€鏈夊疄渚?
    const allInstances = await this.instanceRepository.findByTemplateId(templateId);

    // 鍦ㄥ唴瀛樹腑鎸夋棩鏈熻寖鍥磋繃婊?
    const filteredInstances = allInstances.filter((instance) => {
      const instanceDate = instance.instanceDate as any;
      const timestamp =
        typeof instanceDate === 'number' ? instanceDate : instanceDate.getTime?.() || instanceDate;
      return timestamp >= fromDate && timestamp <= toDate;
    });

    // 杞崲涓哄鎴风 DTO
    return filteredInstances.map((instance) => instance.toClientDTO());
  }
}

