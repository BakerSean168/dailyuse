/**
 * 声明缺少 .d.ts 构建产物的 @dailyuse/schedule 包
 *
 * schedule 包的 dist/ 目录缺少类型声明文件，
 * 导致 TypeScript 无法解析模块类型。
 * 当 schedule 包完成带声明的构建后，此文件可删除。
 */
declare module '@dailyuse/schedule' {
  export class ScheduleTaskFactory {
    createFromSourceEntity(params: {
      identityId: string;
      sourceModule: string;
      sourceEntityId: string;
      sourceEntity: unknown;
    }): any;
  }

  export class ScheduleContainer {
    static getInstance(): ScheduleContainer;
    getScheduleTaskRepository(): any;
  }
}
