/**
 * 声明缺少 .d.ts 构建产物的包模块
 *
 * 以下包的 dist/ 目录缺少类型声明文件（.d.ts），
 * 导致 TypeScript 无法解析模块类型。
 * 当这些包完成构建后，此文件可删除。
 */

declare module '@dailyuse/editor/api' {
  import type { IApiModule } from '@/shared/contracts/api-module';
  export const EditorApiModule: IApiModule;
}

declare module '@dailyuse/notification/api' {
  import type { IApiModule } from '@/shared/contracts/api-module';
  export const NotificationApiModule: IApiModule;
}

declare module '@dailyuse/repository/api' {
  import type { IApiModule } from '@/shared/contracts/api-module';
  export const RepositoryApiModule: IApiModule;
}

declare module '@dailyuse/schedule/api' {
  import type { IApiModule } from '@/shared/contracts/api-module';
  export const ScheduleApiModule: IApiModule;
}
